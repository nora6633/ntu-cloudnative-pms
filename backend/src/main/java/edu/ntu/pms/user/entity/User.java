package edu.ntu.pms.user.entity;

import java.util.List;

import org.hibernate.envers.Audited;
import org.hibernate.envers.NotAudited;

import edu.ntu.pms.user.Role;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Audited
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String username;

    @NotAudited
    @Column(nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @ManyToOne
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    // The department the user belongs to
    @ManyToOne
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    // For HR users, the department they oversee (optional)
    @ManyToOne(optional = true)
    @JoinColumn(name = "overseen_department_id", nullable = true)
    private Department overseenDepartment;

    @ManyToOne(optional = true)
    @JoinColumn(name = "supervisor_id", nullable = true)
    private User supervisor;

    @OneToMany(mappedBy = "supervisor")
    private List<User> subordinates;
}
