package edu.ntu.pms.user.service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.ntu.pms.template.repository.TemplateRepository;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.repository.JobRepository;

@Service
public class JobServiceImpl implements JobService{
 
    private final JobRepository jobRepo;
    private final TemplateRepository templateRepository;
    
    public JobServiceImpl(JobRepository jobRepo, TemplateRepository templateRepository) {
        this.jobRepo = jobRepo;
        this.templateRepository = templateRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Job> getAllJobs() {
        return jobRepo.findAllByOrderByTitleAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Job> getAllJobsWithTemplates() {
        List<Job> jobs = jobRepo.findAllByOrderByTitleAsc();
        jobs.forEach(job -> job.setTemplates(templateRepository.findAllByJobIdOrderByIdAsc(job.getId())));
        return jobs;
    }

    /**
     * Retrieves all jobs for the purpose of starting an evaluation cycle. The
     * provided set of job IDs must match exactly with the set of job IDs in the
     * database. If there is any discrepancy, an IllegalArgumentException is thrown.
     */
    @Override
    @Transactional(readOnly = true)
    public List<Job> getAllJobsForCycleStart(Set<Long> jobIds) {
        List<Job> jobs = jobRepo.findAllWithEmployeesAndSupervisors();
        Set<Long> jobIdsFromDb = jobs.stream().map(Job::getId).collect(Collectors.toSet());

        if (!jobIdsFromDb.equals(jobIds)){
            throw new IllegalArgumentException("Provided job IDs do not match the set of job IDs in the database. " +
                    "Expected: " + jobIdsFromDb + ", Provided: " + jobIds);
        }
        return jobs;
    }
}
