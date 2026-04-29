package edu.ntu.pms.evaluation.entity;

import java.util.List;

import org.hibernate.envers.Audited;

import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "evaluations")
@Audited
@NoArgsConstructor
@Data
public class Evaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String cycle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EvaluationStatus status = EvaluationStatus.INITIAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EvaluationType type;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor;

    @OneToMany(mappedBy = "evaluation")
    private List<EvaluationItem> evaluationItems;

    @OneToMany(mappedBy = "evaluation")
    private List<Goal> goals;

    /*
     * Snapshot fields for historical data
     */
    @Column(nullable = true, length = 100)
    private String employeeName;

    @Column(nullable = true, length = 100)
    private String employeeJobTitle;

    @Column(nullable = true, length = 100)
    private String employeeDepartmentName;

    @Column(nullable = true, length = 100)
    private String supervisorName;

    @Column(nullable = true, length = 100)
    private String supervisorJobTitle;

    @Column(nullable = true, length = 100)
    private String supervisorDepartmentName;

    @Column(nullable = true, length = 100)
    private String hrName;

    @Column(nullable = true, length = 100)
    private String hrJobTitle;

    @Column(nullable = true, length = 100)
    private String hrDepartmentName;
    /*
     * End of snapshot fields
     */
}
