package edu.ntu.pms.user.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import edu.ntu.pms.user.entity.Job;

public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findAllByOrderByTitleAsc();

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"employees", "employees.supervisor"})
    @Query("select j from Job j")
    List<Job> findAllWithEmployeesAndSupervisors();
}
