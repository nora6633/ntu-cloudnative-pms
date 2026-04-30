package edu.ntu.pms.evaluation.entity;

import static edu.ntu.pms.evaluation.enums.EvaluationStatus.*;
import static edu.ntu.pms.evaluation.enums.EvaluationType.*;
import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;

public class EvaluationTests {
    
    @Test
    void lifecycle_happyPath_and_rejectsInvalidCalls() {
        User emp = User.builder().id(1L).username("emp").job(Job.builder().id(1L).title("J").build()).department(Department.builder().id(2L).name("D").build()).build();
        User sup = User.builder().id(2L).username("sup").job(Job.builder().id(1L).title("J").build()).department(Department.builder().id(2L).name("D").build()).build();

        Evaluation e = Evaluation.builder()
                .cycle("2026")
                .status(INITIAL)
                .type(ANNUAL)
                .employee(emp)
                .supervisor(sup)
                .department(Department.builder().id(2L).name("D").build())
                .build();

        e.submitForGoalApproval();
        assertEquals(PENDING_GOAL_APPROVAL, e.getStatus());

        e.rejectGoals();
        assertEquals(INITIAL, e.getStatus());

        e.submitForGoalApproval(); // Re-submit for goal approval
        e.approveGoals();
        assertEquals(WORKING, e.getStatus());

        e.submitForProgressReview();
        assertEquals(REVIEW, e.getStatus());

        e.submitReview();
        assertEquals(PENDING_REVIEW_CONFIRMATION, e.getStatus());

        e.rejectReview();
        assertEquals(REVIEW, e.getStatus());

        e.submitReview(); // Re-submit for review approval
        e.approveReview();
        assertEquals(PENDING_CLOSURE, e.getStatus());

        e.rejectEvaluation();
        assertEquals(REVIEW, e.getStatus());

        e.submitReview(); // Re-submit for review approval
        e.approveReview();
        e.approveEvaluation();
        assertEquals(CLOSED, e.getStatus());

        // invalid: cannot approve goals when closed
        assertThrows(IllegalStateException.class, () -> e.approveGoals());
    }

    @Test
    void snapshot_populatesFields() {
        Job job = Job.builder().id(5L).title("Dev").build();
        Department dept = Department.builder().id(7L).name("Eng").build();

        User emp = User.builder().id(1L).username("emp").job(job).department(dept).build();
        User sup = User.builder().id(2L).username("sup").job(job).department(dept).build();
        User hr = User.builder().id(3L).username("hr").job(job).department(dept).build();

        Evaluation e = Evaluation.builder()
                .cycle("2026")
                .status(CLOSED)
                .type(ANNUAL)
                .employee(emp)
                .supervisor(sup)
                .department(dept)
                .build();

        e.snapshot(hr);

        assertEquals("emp", e.getEmployeeName());
        assertEquals("Dev", e.getEmployeeJobTitle());
        assertEquals("Eng", e.getEmployeeDepartmentName());

        assertEquals("sup", e.getSupervisorName());
        assertEquals("Dev", e.getSupervisorJobTitle());
        assertEquals("Eng", e.getSupervisorDepartmentName());

        assertEquals("hr", e.getHrName());
        assertEquals("Dev", e.getHrJobTitle());
        assertEquals("Eng", e.getHrDepartmentName());
    }
}
