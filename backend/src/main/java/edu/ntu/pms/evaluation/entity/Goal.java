package edu.ntu.pms.evaluation.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.envers.Audited;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "goals")
@Audited
@NoArgsConstructor
@Data
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Optimistic locking version field to prevent lost updates during concurrent progress submissions
    @Version
    private Long version;

    @Column(nullable = false, length = 100)
    private String definition = "";
    
    @Column(nullable = false, length = 255)
    private String metric = "";

    @Column(nullable = false, length = 255)
    private String resource = "";

    @Column(nullable = false, length = 255)
    private String relevance = "";

    @Column(nullable = false)
    private LocalDate deadline;

    @ElementCollection
    @CollectionTable(name = "goal_criteria", joinColumns = @JoinColumn(name = "goal_id"))
    @OrderColumn(name = "position")
    private List<String> criteria = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "goal_progresses", joinColumns = @JoinColumn(name = "goal_id"))
    @OrderColumn(name = "position")
    private List<Progress> progresses = new ArrayList<>();

    @ManyToOne(optional = false)
    @JoinColumn(name = "evaluation_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Evaluation evaluation;
}