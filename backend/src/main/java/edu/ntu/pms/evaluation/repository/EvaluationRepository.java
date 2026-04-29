package edu.ntu.pms.evaluation.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.ntu.pms.evaluation.entity.Evaluation;

public interface EvaluationRepository extends JpaRepository<Evaluation, Long> {
    List<Evaluation> findByEmployeeId(Long employeeId);
    List<Evaluation> findBySupervisorId(Long supervisorId);
    List<Evaluation> findByDepartmentId(Long departmentId);
    
}
