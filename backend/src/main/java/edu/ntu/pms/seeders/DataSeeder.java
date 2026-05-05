package edu.ntu.pms.seeders;

import java.util.Collections;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.entity.Criterion;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.template.repository.TemplateRepository;
import edu.ntu.pms.user.Role;
import edu.ntu.pms.user.entity.Department;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.entity.User;
import edu.ntu.pms.user.repository.DepartmentRepository;
import edu.ntu.pms.user.repository.JobRepository;
import edu.ntu.pms.user.repository.UserRepository;

@Component
public class DataSeeder implements CommandLineRunner {
    // Job Titles
    public static final String JOB_JUNIOR_SOFTWARE_ENGINEER = "Junior Software Engineer";
    public static final String JOB_SENIOR_SOFTWARE_ENGINEER = "Senior Software Engineer";
    public static final String JOB_JUNIOR_HR = "Junior HR";
    public static final String JOB_SENIOR_HR = "Senior HR";

    // Department Names
    public static final String DEPT_ENGINEERING = "Engineering";
    public static final String DEPT_HUMAN_RESOURCES = "Human Resources";

    private final UserRepository userRepo;
    private final JobRepository jobRepo;
    private final DepartmentRepository deptRepo;
    private final TemplateRepository templateRepo;
    private final PasswordEncoder encoder;

    public DataSeeder(UserRepository userRepo, PasswordEncoder encoder, 
        JobRepository jobRepo, DepartmentRepository deptRepo, TemplateRepository templateRepo) {
        this.userRepo = userRepo;
        this.jobRepo = jobRepo;
        this.deptRepo = deptRepo;
        this.templateRepo = templateRepo;
        this.encoder = encoder;
    }

    @Override
    public void run(String... args) throws Exception {
        seedJobsAndDepartments();
        seedUsers();
        seedTemplates();
    }

    private void seedJobsAndDepartments() {
        if (jobRepo.count() == 0) {
            jobRepo.saveAll(List.of(
                Job.builder().title(JOB_JUNIOR_SOFTWARE_ENGINEER).build(),
                Job.builder().title(JOB_SENIOR_SOFTWARE_ENGINEER).build(),
                Job.builder().title(JOB_JUNIOR_HR).build(),
                Job.builder().title(JOB_SENIOR_HR).build()
            ));
        }
        if (deptRepo.count() == 0) {
            deptRepo.saveAll(List.of(
                Department.builder().name(DEPT_ENGINEERING).build(),
                Department.builder().name(DEPT_HUMAN_RESOURCES).build()
            ));
        }
    }

    private void seedUsers() {
        if (userRepo.count() > 0)
            return;

        Job juniorSoftwareEngineer = findJobByTitle(JOB_JUNIOR_SOFTWARE_ENGINEER);
        Job seniorSoftwareEngineer = findJobByTitle(JOB_SENIOR_SOFTWARE_ENGINEER);
        Job juniorHrJob = findJobByTitle(JOB_JUNIOR_HR);
        Job seniorHrJob = findJobByTitle(JOB_SENIOR_HR);

        Department engineering = findDepartmentByName(DEPT_ENGINEERING);
        Department humanResources = findDepartmentByName(DEPT_HUMAN_RESOURCES);

        seedUser("admin", "admin123", Role.ADMIN, seniorHrJob,
                humanResources, null, null, Collections.emptyList());
        
        User manager = seedUser("manager", "manager123", Role.MANAGER, seniorSoftwareEngineer, 
                engineering, null, null, Collections.emptyList());

        seedUser("employee", "employee123", Role.EMPLOYEE, juniorSoftwareEngineer,
                engineering, null, manager, Collections.emptyList());

        User seniorHr = seedUser("seniorhr", "seniorhr123", Role.HR, seniorHrJob, 
                humanResources, humanResources, null, Collections.emptyList());
        
        seedUser("juniorhr", "juniorhr123", Role.HR, juniorHrJob, 
                humanResources, engineering, seniorHr, Collections.emptyList());
    }

    private Job findJobByTitle(String title) {
        return jobRepo.findAll().stream()
                .filter(job -> job.getTitle().equals(title))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Missing seeded job: " + title));
    }

    private Department findDepartmentByName(String name) {
        return deptRepo.findAll().stream()
                .filter(department -> department.getName().equals(name))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Missing seeded department: " + name));
    }

    private User seedUser(String username, String rawPassword, Role role, Job job, Department department,
        Department overseenDepartment, User supervisor, List<User> subordinates) {
        return userRepo.save(User.builder()
                .username(username)
                .passwordHash(encoder.encode(rawPassword))
                .role(role)
                .job(job)
                .department(department)
                .overseenDepartment(overseenDepartment)
                .supervisor(supervisor)
                .subordinates(subordinates)
                .build());
    }

    private void seedTemplates() {
        if (templateRepo.count() > 0)
            return;
            
        Job juniorSoftwareEngineer = findJobByTitle(JOB_JUNIOR_SOFTWARE_ENGINEER);
        Job seniorSoftwareEngineer = findJobByTitle(JOB_SENIOR_SOFTWARE_ENGINEER);
        Job juniorHrJob = findJobByTitle(JOB_JUNIOR_HR);
        Job seniorHrJob = findJobByTitle(JOB_SENIOR_HR);
        
        seedAnnualTemplate(juniorSoftwareEngineer, seniorSoftwareEngineer, juniorHrJob, seniorHrJob);
        seedQuarterTemplate(juniorSoftwareEngineer, seniorSoftwareEngineer, juniorHrJob, seniorHrJob);
        seedProbationTemplate(juniorSoftwareEngineer, seniorSoftwareEngineer, juniorHrJob, seniorHrJob);
    }

    private void seedTemplate(Job job, EvaluationType type, List<Criterion> criteria) {
        Template template = Template.builder()
                .job(job)
                .evaluationType(type)
                .criteria(criteria)
                .build();
        templateRepo.save(template);
    }

    private void seedAnnualTemplate(Job juniorSoftwareEngineer, Job seniorSoftwareEngineer, Job juniorHrJob, Job seniorHrJob) {
        seedTemplate(juniorSoftwareEngineer, EvaluationType.ANNUAL, List.of(
            new Criterion("Code Quality", "Assess the quality of code produced by the employee."),
            new Criterion("Team Collaboration", "Evaluate how well the employee collaborates with team members."),
            new Criterion("Problem Solving", "Evaluate the employee's ability to solve technical problems.")
        ));

        seedTemplate(seniorSoftwareEngineer, EvaluationType.ANNUAL, List.of(
            new Criterion("Code Quality", "Assess the quality of code produced by the employee."),
            new Criterion("Team Leadership", "Evaluate how well the employee leads and mentors team members."),
            new Criterion("Project Management", "Evaluate the employee's ability to manage projects and meet deadlines.")
        ));

        seedTemplate(juniorHrJob, EvaluationType.ANNUAL, List.of(
            new Criterion("Employee Relations", "Assess the employee's ability to manage employee relations."),
            new Criterion("Recruitment", "Evaluate the employee's effectiveness in recruitment processes."),
            new Criterion("HR Compliance", "Evaluate the employee's knowledge and adherence to HR policies and regulations.")
        ));

        seedTemplate(seniorHrJob, EvaluationType.ANNUAL, List.of(
            new Criterion("Employee Relations", "Assess the employee's ability to manage employee relations."),
            new Criterion("HR Strategy", "Evaluate the employee's ability to develop and implement HR strategies."),
            new Criterion("Leadership", "Evaluate the employee's leadership skills and ability to manage HR teams.")
        ));
    }

    private void seedQuarterTemplate(Job juniorSoftwareEngineer, Job seniorSoftwareEngineer, Job juniorHrJob, Job seniorHrJob) {
        seedTemplate(juniorSoftwareEngineer, EvaluationType.QUARTER, List.of(
            new Criterion("Code Quality", "Assess the quality of code produced by the employee."),
            new Criterion("Team Collaboration", "Evaluate how well the employee collaborates with team members.")
        ));

        seedTemplate(seniorSoftwareEngineer, EvaluationType.QUARTER, List.of(
            new Criterion("Code Quality", "Assess the quality of code produced by the employee."),
            new Criterion("Team Leadership", "Evaluate how well the employee leads and mentors team members.")
        ));

        seedTemplate(juniorHrJob, EvaluationType.QUARTER, List.of(
            new Criterion("Employee Relations", "Assess the employee's ability to manage employee relations."),
            new Criterion("Recruitment", "Evaluate the employee's effectiveness in recruitment processes.")
        ));

        seedTemplate(seniorHrJob, EvaluationType.QUARTER, List.of(
            new Criterion("Employee Relations", "Assess the employee's ability to manage employee relations."),
            new Criterion("HR Strategy", "Evaluate the employee's ability to develop and implement HR strategies.")
        ));
    }

    private void seedProbationTemplate(Job juniorSoftwareEngineer, Job seniorSoftwareEngineer, Job juniorHrJob, Job seniorHrJob) {
        seedTemplate(juniorSoftwareEngineer, EvaluationType.PROBATION, List.of(
            new Criterion("Code Quality", "Assess the quality of code produced by the employee."),
            new Criterion("Team Collaboration", "Evaluate how well the employee collaborates with team members.")
        ));

        seedTemplate(seniorSoftwareEngineer, EvaluationType.PROBATION, List.of(
            new Criterion("Code Quality", "Assess the quality of code produced by the employee."),
            new Criterion("Team Leadership", "Evaluate how well the employee leads and mentors team members.")
        ));

        seedTemplate(juniorHrJob, EvaluationType.PROBATION, List.of(
            new Criterion("Employee Relations", "Assess the employee's ability to manage employee relations."),
            new Criterion("Recruitment", "Evaluate the employee's effectiveness in recruitment processes.")
        ));

        seedTemplate(seniorHrJob, EvaluationType.PROBATION, List.of(
            new Criterion("Employee Relations", "Assess the employee's ability to manage employee relations."),
            new Criterion("HR Strategy", "Evaluate the employee's ability to develop and implement HR strategies.")
        ));
    }


}
