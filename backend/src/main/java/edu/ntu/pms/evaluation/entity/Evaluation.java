package edu.ntu.pms.evaluation.entity;

import java.util.List;

import org.hibernate.envers.Audited;
import org.hibernate.envers.RelationTargetAuditMode;

import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.User;
import jakarta.persistence.CascadeType;
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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "evaluations")
@Audited
@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class Evaluation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String cycle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EvaluationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private EvaluationType type;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private User employee;

    @ManyToOne
    @JoinColumn(name = "supervisor_id", nullable = false)
    private User supervisor;

    @Audited(targetAuditMode = RelationTargetAuditMode.NOT_AUDITED)
    @ManyToOne
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @OneToMany(mappedBy = "evaluation")
    private List<EvaluationItem> evaluationItems;

    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Goal> goals;

    // Snapshot fields for historical data
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

    public void submitForGoalApproval(){
        this.status.assertCanTransitionTo(EvaluationStatus.PENDING_GOAL_APPROVAL);
        this.status = EvaluationStatus.PENDING_GOAL_APPROVAL;
    };

    public void approveGoals(){
        this.status.assertCanTransitionTo(EvaluationStatus.WORKING);
        this.status = EvaluationStatus.WORKING;
    }

    public void rejectGoals(){
        this.status.assertCanTransitionTo(EvaluationStatus.INITIAL);
        this.status = EvaluationStatus.INITIAL;
    }

    public void submitForProgressReview(){
        this.status.assertCanTransitionTo(EvaluationStatus.REVIEW);
        this.status = EvaluationStatus.REVIEW;
    }

    public void submitReview(){
        this.status.assertCanTransitionTo(EvaluationStatus.PENDING_REVIEW_CONFIRMATION);
        this.status = EvaluationStatus.PENDING_REVIEW_CONFIRMATION;
    };

    public void approveReview(){
        this.status.assertCanTransitionTo(EvaluationStatus.PENDING_CLOSURE);
        this.status = EvaluationStatus.PENDING_CLOSURE;
    }

    public void rejectReview(){
        this.status.assertCanTransitionTo(EvaluationStatus.REVIEW);
        this.status = EvaluationStatus.REVIEW;
    }

    public void approveEvaluation(){
        this.status.assertCanTransitionTo(EvaluationStatus.CLOSED);
        this.status = EvaluationStatus.CLOSED;
    };

    public void rejectEvaluation(){
        this.status.assertCanTransitionTo(EvaluationStatus.REVIEW);
        this.status = EvaluationStatus.REVIEW;
    }

    /**
     * Takes a snapshot of the employee, supervisor, and HR details at the time of evaluation closure.
     * @param hr The HR user who is approving the evaluation closure, whose details will be included in the snapshot.
     */
    public void snapshot(User hr) {
        this.employeeName = employee.getUsername();
        this.employeeJobTitle = employee.getJob().getTitle();
        this.employeeDepartmentName = employee.getDepartment().getName();

        this.supervisorName = supervisor.getUsername();
        this.supervisorJobTitle = supervisor.getJob().getTitle();
        this.supervisorDepartmentName = supervisor.getDepartment().getName();

        this.hrName = hr.getUsername();
        this.hrJobTitle = hr.getJob().getTitle();
        this.hrDepartmentName = hr.getDepartment().getName();
    }
}
