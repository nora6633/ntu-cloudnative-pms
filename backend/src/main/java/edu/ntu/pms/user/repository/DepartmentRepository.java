package edu.ntu.pms.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.ntu.pms.user.entity.Department;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

}
