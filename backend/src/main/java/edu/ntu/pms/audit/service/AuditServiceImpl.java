package edu.ntu.pms.audit.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;

import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.hibernate.envers.query.AuditQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.ntu.pms.audit.CustomRevisionEntity;
import edu.ntu.pms.audit.dto.AuditLogDTO;
import edu.ntu.pms.audit.dto.AuditLogFilter;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.user.entity.User;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class AuditServiceImpl implements AuditService {

    @PersistenceContext
    private EntityManager em;

    /**
     * Audited modules that can be queried as standalone entities. `Progress` and
     * `Criterion` are `@Embeddable` and have no standalone id, so they're audited
     * as part of their parent entity's collection and not exposed here.
     */
    private static final Map<String, Class<?>> MODULES = Map.of(
            "User", User.class,
            "Evaluation", Evaluation.class,
            "EvaluationItem", EvaluationItem.class,
            "Goal", Goal.class,
            "Template", Template.class);

    private static final Map<Class<?>, Function<Object, Long>> ID_EXTRACTORS = Map.of(
            User.class, e -> ((User) e).getId(),
            Evaluation.class, e -> ((Evaluation) e).getId(),
            EvaluationItem.class, e -> ((EvaluationItem) e).getId(),
            Goal.class, e -> ((Goal) e).getId(),
            Template.class, e -> ((Template) e).getId());

    @Override
    public Set<String> getAvailableModules() {
        return MODULES.keySet();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLogDTO> getAuditLogs(AuditLogFilter filter, Pageable pageable) {
        AuditReader reader = AuditReaderFactory.get(em);

        Collection<Class<?>> entityClasses;
        if (filter.module() != null && !filter.module().isBlank()) {
            Class<?> picked = MODULES.get(filter.module());
            if (picked == null) {
                return new PageImpl<>(List.of(), pageable, 0);
            }
            entityClasses = List.of(picked);
        } else {
            entityClasses = MODULES.values();
        }

        Long recordIdLong = parseRecordId(filter.recordId());
        if (filter.recordId() != null && !filter.recordId().isBlank() && recordIdLong == null) {
            // recordId requested but unparseable — no row can match
            return new PageImpl<>(List.of(), pageable, 0);
        }

        RevisionType actionType = parseActionType(filter.actionType());
        if (filter.actionType() != null && !filter.actionType().isBlank() && actionType == null) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        List<AuditLogDTO> all = new ArrayList<>();
        for (Class<?> entityClass : entityClasses) {
            all.addAll(queryEntity(reader, entityClass, filter, recordIdLong, actionType));
        }

        all.sort(Comparator.comparing(AuditLogDTO::rev).reversed());

        int offset = (int) pageable.getOffset();
        int end = Math.min(offset + pageable.getPageSize(), all.size());
        List<AuditLogDTO> pageContent = offset >= all.size() ? List.of() : all.subList(offset, end);
        return new PageImpl<>(pageContent, pageable, all.size());
    }

    private List<AuditLogDTO> queryEntity(
            AuditReader reader,
            Class<?> entityClass,
            AuditLogFilter filter,
            Long recordIdLong,
            RevisionType actionType) {

        AuditQuery query = reader.createQuery()
                .forRevisionsOfEntity(entityClass, false, true);

        if (recordIdLong != null) {
            query.add(AuditEntity.id().eq(recordIdLong));
        }
        if (actionType != null) {
            query.add(AuditEntity.revisionType().eq(actionType));
        }
        if (filter.actor() != null && !filter.actor().isBlank()) {
            query.add(AuditEntity.revisionProperty("username").eq(filter.actor()));
        }
        if (filter.from() != null) {
            query.add(AuditEntity.revisionProperty("timestamp").ge(filter.from().toEpochMilli()));
        }
        if (filter.to() != null) {
            query.add(AuditEntity.revisionProperty("timestamp").le(filter.to().toEpochMilli()));
        }

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();

        Function<Object, Long> idOf = ID_EXTRACTORS.get(entityClass);
        String moduleName = entityClass.getSimpleName();
        List<AuditLogDTO> dtos = new ArrayList<>(rows.size());

        for (Object[] row : rows) {
            Object entity = row[0];
            CustomRevisionEntity rev = (CustomRevisionEntity) row[1];
            RevisionType type = (RevisionType) row[2];
            String recordId = entity == null ? null : String.valueOf(idOf.apply(entity));
            String action = toActionType(type);
            dtos.add(new AuditLogDTO(
                    rev.getId(),
                    Instant.ofEpochMilli(rev.getTimestamp()),
                    rev.getUsername(),
                    rev.getIpAddress(),
                    moduleName,
                    recordId,
                    action,
                    buildSummary(action, moduleName, recordId)));
        }
        return dtos;
    }

    private static Long parseRecordId(String raw) {
        if (raw == null || raw.isBlank()) return null;
        try {
            return Long.parseLong(raw.trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static RevisionType parseActionType(String raw) {
        if (raw == null || raw.isBlank()) return null;
        return switch (raw.toUpperCase()) {
            case "CREATE" -> RevisionType.ADD;
            case "UPDATE" -> RevisionType.MOD;
            case "DELETE" -> RevisionType.DEL;
            default -> null;
        };
    }

    private static String toActionType(RevisionType type) {
        return switch (type) {
            case ADD -> "CREATE";
            case MOD -> "UPDATE";
            case DEL -> "DELETE";
        };
    }

    private static String buildSummary(String action, String module, String recordId) {
        String verb = switch (action) {
            case "CREATE" -> "Created";
            case "UPDATE" -> "Updated";
            case "DELETE" -> "Deleted";
            default -> action;
        };
        if (recordId == null) {
            return verb + " " + module;
        }
        return verb + " " + module + " #" + recordId;
    }
}
