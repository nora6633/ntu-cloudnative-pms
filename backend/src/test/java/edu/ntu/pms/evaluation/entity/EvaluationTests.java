package edu.ntu.pms.evaluation.entity;

import static edu.ntu.pms.evaluation.enums.EvaluationStatus.*;
import static edu.ntu.pms.evaluation.enums.EvaluationType.*;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;

public class EvaluationTests {

    private User emp;
    private User sup;
    private Department dept;
    private Job job;
    private Evaluation evaluation;
    private EvaluationItem item;


    @BeforeEach
    void setup() {
        job = Job.builder().id(1L).title("J").build();
        dept = Department.builder().id(2L).name("D").build();
        emp = User.builder().id(1L).username("emp").job(job).department(dept).build();
        sup = User.builder().id(2L).username("sup").job(job).department(dept).build();

        item = EvaluationItem.builder().id(10L).description("Item 1").build();

        evaluation = Evaluation.builder()
                .cycle("2026")
                .status(INITIAL)
                .type(ANNUAL)
                .employee(emp)
                .supervisor(sup)
                .department(dept)
                .build();
    }
    
    @Test
    void lifecycle_happyPath_and_rejectsInvalidCalls() {
        evaluation.setEvaluationItems(List.of(item));
        evaluation.setGoals(List.of(new Goal()));

        evaluation.submitForGoalApproval();
        assertEquals(PENDING_GOAL_APPROVAL, evaluation.getStatus());

        evaluation.rejectGoals();
        assertEquals(INITIAL, evaluation.getStatus());

        evaluation.submitForGoalApproval(); // Re-submit for goal approval
        evaluation.approveGoals();
        assertEquals(WORKING, evaluation.getStatus());

        evaluation.submitForProgressReview();
        assertEquals(REVIEW, evaluation.getStatus());

        evaluation.getEvaluationItems().get(0).setFeedback("fb");
        evaluation.getEvaluationItems().get(0).setRating(3);
        evaluation.submitReview();
        assertEquals(PENDING_REVIEW_CONFIRMATION, evaluation.getStatus());

        evaluation.rejectReview();
        assertEquals(REVIEW, evaluation.getStatus());

        evaluation.submitReview(); // Re-submit for review approval
        evaluation.approveReview();
        assertEquals(PENDING_CLOSURE, evaluation.getStatus());

        evaluation.rejectEvaluation();
        assertEquals(REVIEW, evaluation.getStatus());

        evaluation.submitReview(); // Re-submit for review approval
        evaluation.approveReview();
        evaluation.approveEvaluation();
        assertEquals(CLOSED, evaluation.getStatus());

        // invalid: cannot approve goals when closed
        assertThrows(IllegalStateException.class, () -> evaluation.approveGoals());
    }

    @Test
    void snapshot_rejectsIfNotClosed() {
        evaluation.setStatus(WORKING);

        User hr = User.builder().id(3L).username("hr").job(job).department(dept).build();

        assertThrows(IllegalStateException.class, () -> evaluation.snapshot(hr));
    }

    @Test
    void snapshot_populatesFields() {
        User hr = User.builder().id(3L).username("hr").job(job).department(dept).build();

        evaluation.setStatus(CLOSED);

        evaluation.snapshot(hr);

        assertEquals("emp", evaluation.getEmployeeName());
        assertEquals("J", evaluation.getEmployeeJobTitle());
        assertEquals("D", evaluation.getEmployeeDepartmentName());

        assertEquals("sup", evaluation.getSupervisorName());
        assertEquals("J", evaluation.getSupervisorJobTitle());
        assertEquals("D", evaluation.getSupervisorDepartmentName());

        assertEquals("hr", evaluation.getHrName());
        assertEquals("J", evaluation.getHrJobTitle());
        assertEquals("D", evaluation.getHrDepartmentName());
    }

    @Test
    void submitForGoalApproval_rejectsIfStatusNotInitial() {
        evaluation.setStatus(WORKING);
        assertThrows(IllegalStateException.class, () -> evaluation.submitForGoalApproval());
    }

    @Test
    void submitForGoalApproval_rejectsIfNoGoalsSet() {
        assertThrows(IllegalStateException.class, () -> evaluation.submitForGoalApproval());
    }

    @Test
    void submitReview_rejectsIfStatusNotInReview() {
        evaluation.setStatus(WORKING);
        assertThrows(IllegalStateException.class, () -> evaluation.submitReview());
    }

    @Test
    void submitReview_rejectsIfItemsUncommented() {
        item.setRating(3);

        evaluation.setStatus(REVIEW);
        evaluation.setEvaluationItems(List.of(item));

        assertThrows(IllegalStateException.class, () -> evaluation.submitReview());
    }

    @Test
    void submitReview_rejectsIfItemsFeedbackIsBlank() {
        item.setRating(3);
        item.setFeedback("");

        evaluation.setStatus(REVIEW);
        evaluation.setEvaluationItems(List.of(item));

        assertThrows(IllegalStateException.class, () -> evaluation.submitReview());
    }

    @Test
    void submitReview_rejectsIfItemsUnscored() {
        item.setFeedback("fb");

        evaluation.setStatus(REVIEW);
        evaluation.setEvaluationItems(List.of(item));

        assertThrows(IllegalStateException.class, () -> evaluation.submitReview());
    }

}