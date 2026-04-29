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
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "goals")
@Audited
@NoArgsConstructor
@Data
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

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
    private Evaluation evaluation;
}