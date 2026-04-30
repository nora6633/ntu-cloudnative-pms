package edu.ntu.pms.evaluation.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.entity.EvaluationItem;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.service.TemplateService;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.service.JobService;
import edu.ntu.pms.evaluation.repository.EvaluationRepository;

/**
 * Service class responsible for creating evaluations. This class contains the
 * business logic for starting evaluation cycles and creating evaluations for
 * new users based on their job roles and the provided templates.
 * It interacts with the EvaluationRepository to persist evaluations, the
 * JobService to retrieve job information, and the TemplateService to generate
 * evaluation items based on templates.
 */
@Service
public class EvaluationCreationService  {

    private final EvaluationRepository evalRepo;
    private final JobService jobService;
    private final TemplateService templateService;

    public EvaluationCreationService(EvaluationRepository evalRepo, JobService jobService,
            TemplateService templateService) {
        this.evalRepo = evalRepo;
        this.jobService = jobService;
        this.templateService = templateService;
    }

    /**
     * Start an evaluation cycle for employees.
     * The provided `jobToTemplateIdMap` must contain a mapping for every Job id
     * present in the database.
     * 
     * @param cycleName          Name of the evaluation cycle (e.g. "2024 Mid-Year
     *                           Review")
     * @param evaluationType     Type of the evaluation cycle (PROBATION, QUARTER,
     *                           ANNUAL)
     * @param jobToTemplateIdMap A map where the key is a Job ID and the value is
     *                           the Template ID to be used for evaluations of
     *                           employees in that Job.
     */
    @Transactional
    public void startEvaluationCycle(String cycleName, EvaluationType evaluationType, Map<Long, Long> jobToTemplateIdMap) {
        List<Job> jobs = jobService.getAllJobsForCycleStart(jobToTemplateIdMap.keySet());

        Map<Job, List<EvaluationItem>> jobEvaluationItemsMap = getJobToEvaluationItemsMap(jobToTemplateIdMap,
                evaluationType, jobs);

        List<Evaluation> evaluationsToCreate = jobs.stream()
                .flatMap(job -> job.getEmployees().stream()
                        .map(employee -> createEvaluation(cycleName, evaluationType, employee,
                                employee.getSupervisor(), employee.getDepartment(), jobEvaluationItemsMap.get(job))))
                .collect(Collectors.toList());

        evalRepo.saveAll(evaluationsToCreate);
    }

    // Helper method to generate evaluation items for each job based on the provided template IDs and evaluation type.
    private Map<Job, List<EvaluationItem>> getJobToEvaluationItemsMap(
            Map<Long, Long> jobToTemplateIdMap, EvaluationType evaluationType, List<Job> jobs) {
        return jobs.stream().collect(Collectors.toMap(
                job -> job,
                job -> templateService.createEvaluationItemsForJob(job, jobToTemplateIdMap.get(job.getId()), evaluationType)
        ));
    }

    // Builder method to create an Evaluation object with the provided parameters.
    private Evaluation createEvaluation(String cycle, EvaluationType type, User employee,
            User supervisor, Department department, List<EvaluationItem> items) {
        return Evaluation.builder()
                .cycle(cycle)
                .status(EvaluationStatus.INITIAL)
                .type(type)
                .employee(employee)
                .supervisor(supervisor)
                .department(department)
                .evaluationItems(items)
                .build();
    }

    /**
     * Create an evaluation for a newly onboarded user. 
     * The evaluation will be created with the "Probation" type 
     * and will be based on the provided template ID.
     * This method is intended to be called when a new user is registered in the system.
     * 
     * @param user The newly onboarded user for whom to create an evaluation.
     * @param templateId The ID of the template to use for creating the evaluation.
     */
    public void createEvaluationForNewUser(User user, Long templateId) {
        List<EvaluationItem> items = templateService.createEvaluationItemsForJob(user.getJob(), templateId, EvaluationType.PROBATION);
        Evaluation eval = createEvaluation(
            "Probation - " + user.getUsername(), 
            EvaluationType.PROBATION, user,
                user.getSupervisor(), user.getDepartment(), items);
        evalRepo.save(eval);
    }
}
