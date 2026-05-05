package edu.ntu.pms.evaluation.entity;

import org.hibernate.envers.Audited;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "evaluation_items")
@Audited
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class EvaluationItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;
    
    @Column(nullable = false, length = 255)
    private String description;
    
    @Column(nullable = true, length = 255)
    private String feedback;

    @Column(nullable = true)
    private Integer rating;

    @ManyToOne(optional = false)
    @JoinColumn(name = "evaluation_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Evaluation evaluation;

    public EvaluationItem clone() {
        return EvaluationItem.builder()
                .name(this.name)
                .description(this.description)
                .feedback(this.feedback)
                .rating(this.rating)
                .build();
    }
}
