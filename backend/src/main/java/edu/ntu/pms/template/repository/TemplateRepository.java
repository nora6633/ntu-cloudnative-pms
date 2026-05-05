package edu.ntu.pms.template.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.ntu.pms.template.entity.Template;

public interface TemplateRepository extends JpaRepository<Template, Long> {

}