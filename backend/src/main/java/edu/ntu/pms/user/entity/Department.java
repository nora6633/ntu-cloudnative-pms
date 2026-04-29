package edu.ntu.pms.user.entity;

import java.util.List;

import edu.ntu.pms.evaluation.entity.Evaluation;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "departments")
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @OneToMany(mappedBy = "department")
    private List<User> employees;

    @OneToMany(mappedBy = "overseenDepartment")
    private List<User> overseers;

    @OneToMany(mappedBy = "department")
    private List<Evaluation> evaluations;
}
