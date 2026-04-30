package edu.ntu.pms.evaluation.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.ntu.pms.evaluation.entity.EvaluationItem;

public interface EvaluationItemRepository extends JpaRepository<EvaluationItem, Long> {
    
}
