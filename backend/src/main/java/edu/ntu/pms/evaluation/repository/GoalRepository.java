package edu.ntu.pms.evaluation.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import edu.ntu.pms.evaluation.entity.Goal;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    
    // Using EntityGraph to fetch the related evaluation, employee, and supervisor
    // to prevent N+1 queries when checking authorizations and statuses.
    @EntityGraph(attributePaths = {
        "evaluation",
        "evaluation.employee",
        "evaluation.supervisor",
        "progresses"
    })
    Optional<Goal> findById(Long id);
}
