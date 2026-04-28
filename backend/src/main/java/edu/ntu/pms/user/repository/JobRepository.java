package edu.ntu.pms.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.ntu.pms.user.entity.Job;

public interface JobRepository extends JpaRepository<Job, Long> {
    
}
