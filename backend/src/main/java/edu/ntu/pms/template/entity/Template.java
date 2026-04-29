package edu.ntu.pms.template.entity;

import java.util.List;

import org.hibernate.envers.Audited;

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
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "templates")
@Audited
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Template {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EvaluationType evaluationType;

    @ElementCollection
    @CollectionTable(name = "template_criteria", joinColumns = @JoinColumn(name = "template_id"))
    List<Criterion> criteria;
}
