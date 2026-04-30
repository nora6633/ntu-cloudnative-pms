package edu.ntu.pms.user.service;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Service;

import edu.ntu.pms.user.entity.Job;

@Service
public interface JobService {
    List<Job> getAllJobs();
    List<Job> getAllJobsForCycleStart(Set<Long> jobIds);
}
