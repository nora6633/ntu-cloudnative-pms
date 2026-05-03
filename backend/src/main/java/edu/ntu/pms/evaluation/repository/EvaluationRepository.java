package edu.ntu.pms.evaluation.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Query;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import edu.ntu.pms.evaluation.entity.Evaluation;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    @EntityGraph(attributePaths = {"employee", "employee.job", "supervisor", "supervisor.job", "department"})
    Slice<Evaluation> findByEmployeeId(Long employeeId, Pageable pageable);

    @EntityGraph(attributePaths = {"employee", "employee.job", "supervisor", "supervisor.job", "department"})
    Slice<Evaluation> findBySupervisorId(Long supervisorId, Pageable pageable);

    @EntityGraph(attributePaths = {"employee", "employee.job", "supervisor", "supervisor.job", "department"})
    Slice<Evaluation> findByDepartmentId(Long departmentId, Pageable pageable);

    @EntityGraph(attributePaths = {"evaluationItems", "goals", "employee", "supervisor", "department"})
    Optional<Evaluation> findWithRelationsById(Long id);

        @Query("select distinct e from Evaluation e "
            + "left join fetch e.evaluationItems ei "
            + "left join fetch e.goals g "
            + "left join fetch g.criteria gc "
            + "left join fetch g.progresses gp "
            + "left join fetch e.employee emp "
            + "left join fetch emp.job empJob "
            + "left join fetch e.supervisor sup "
            + "left join fetch sup.job supJob "
            + "where e.id in :ids")
    List<Evaluation> findAllWithCollectionsByIdIn(List<Long> ids);

    @Query("select distinct e from Evaluation e "
        + "left join fetch e.evaluationItems ei "
        + "left join fetch e.goals g "
        + "left join fetch g.criteria gc "
        + "left join fetch g.progresses gp "
        + "left join fetch e.employee emp "
        + "left join fetch emp.job empJob "
        + "left join fetch e.supervisor sup "
        + "left join fetch sup.job supJob "
        + "left join fetch e.department d "
        + "where e.id = :id")
    Optional<Evaluation> findWithAllCollectionsById(Long id);
}
