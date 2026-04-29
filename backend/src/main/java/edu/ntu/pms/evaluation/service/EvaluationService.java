package edu.ntu.pms.evaluation.service;

import java.util.List;

import org.springframework.stereotype.Service;

import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.entity.Goal;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.User;

@Service
public interface EvaluationService {
    
    List<Evaluation> getMyEvaluations();
    
    List<Evaluation> getEvaluationsForManager();
    
    List<Evaluation> getEvaluationsForHr();
    
    void startEvaluationCycle(String cycleName);

    void createEvaluation(String cycle, User employee, User supervisor, Department department);

    void draftGoals(Long evaluationId, List<Goal> goals);

    void draftReview(Long evaluationId, List<EvaluationItem> items);

    // Employee actions
    void submitForGoalApproval(Long evaluationId);

    void submitForProgressReview(Long evaluationId);

    void approveReview(Long evaluationId);

    void rejectReview(Long evaluationId);

    // Manager actions
    void approveGoals(Long evaluationId);

    void rejectGoals(Long evaluationId);

    void submitReview(Long evaluationId);

    // HR actions
    void approveEvaluation(Long evaluationId);

    void rejectEvaluation(Long evaluationId);

}
