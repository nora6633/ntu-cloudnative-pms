package edu.ntu.pms.template.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import edu.ntu.pms.template.entity.Template;

public interface TemplateRepository extends JpaRepository<Template, Long> {

    @EntityGraph(attributePaths = "criteria")
    List<Template> findAllByJobIdOrderByIdAsc(Long jobId);
}
