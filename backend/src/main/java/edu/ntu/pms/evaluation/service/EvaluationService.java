package edu.ntu.pms.evaluation.service;

import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import edu.ntu.pms.evaluation.dto.EvaluationItemDTO;
import edu.ntu.pms.evaluation.dto.GoalDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.user.entity.User;

@Service
public interface EvaluationService {
    
    List<Evaluation> getMyEvaluations();
    
    List<Evaluation> getEvaluationsForManager();
    
    List<Evaluation> getEvaluationsForHr();
    
    /**
     * Start an evaluation cycle for employees.
     * The provided `jobToTemplateIdMap` must contain a mapping for every Job id present in the database.
     * 
     * @param cycleName Name of the evaluation cycle (e.g. "2024 Mid-Year Review")
     * @param evaluationType Type of the evaluation cycle (PROBATION, QUARTER, ANNUAL)
     * @param jobToTemplateIdMap A map where the key is a Job ID and the value is the Template ID to be used for evaluations of employees in that Job.
     */
    void startEvaluationCycle(String cycleName, EvaluationType evaluationType, Map<Long, Long> jobToTemplateIdMap);

    /**
     * Create an evaluation for a newly onboarded user. 
     * The evaluation will be created with the "Probation" type 
     * and will be based on the provided template ID.
     * This method is intended to be called when a new user is registered in the system.
     * 
     * @param user The newly onboarded user for whom to create an evaluation.
     * @param templateId The ID of the template to use for creating the evaluation.
     */
    void createEvaluationForNewUser(User user, Long templateId);

    void draftGoals(Long evaluationId, List<GoalDTO> goals);

    void draftReview(Long evaluationId, List<EvaluationItemDTO> items);

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
