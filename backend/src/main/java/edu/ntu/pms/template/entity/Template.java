package edu.ntu.pms.template.entity;

import java.util.List;

import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;

import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.user.entity.Job;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "templates", uniqueConstraints = {
        @UniqueConstraint(name = "uk_templates_job_name", columnNames = { "job_id", "name" })
})
@Audited
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class Template {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne(optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Column(nullable = false, length = 150)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EvaluationType evaluationType;

    @ElementCollection
    @CollectionTable(name = "template_criteria", joinColumns = @JoinColumn(name = "template_id"))
    @OrderColumn(name = "position")
    private List<Criterion> criteria;
}
