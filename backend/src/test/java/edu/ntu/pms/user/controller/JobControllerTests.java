package edu.ntu.pms.user.controller;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.dto.CriterionDTO;
import edu.ntu.pms.template.dto.JobSummaryDTO;
import edu.ntu.pms.template.dto.JobTemplatesDTO;
import edu.ntu.pms.template.dto.TemplateDTO;
import edu.ntu.pms.template.entity.Criterion;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.template.mapper.TemplateMapper;
import edu.ntu.pms.user.entity.Job;
import edu.ntu.pms.user.service.JobService;

@WebMvcTest(JobController.class)
@AutoConfigureMockMvc(addFilters = false)
class JobControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JobService jobService;

    @MockitoBean
    private TemplateMapper templateMapper;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void getAllJobs_returnsOkAndJson() throws Exception {
        Job hrJob = Job.builder().id(2L).title("Junior HR").build();
        Job engineerJob = Job.builder().id(1L).title("Junior Software Engineer").build();

        when(jobService.getAllJobs()).thenReturn(List.of(hrJob, engineerJob));
        when(templateMapper.toJobSummaryDto(hrJob))
                .thenReturn(new JobSummaryDTO(2L, "Junior HR"));
        when(templateMapper.toJobSummaryDto(engineerJob))
                .thenReturn(new JobSummaryDTO(1L, "Junior Software Engineer"));

        mockMvc.perform(get("/jobs"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(2))
                .andExpect(jsonPath("$[0].title").value("Junior HR"));

        verify(jobService).getAllJobs();
    }

    @Test
    void getAllJobsWithTemplates_returnsOkAndJson() throws Exception {
        Job job = Job.builder().id(1L).title("Junior Software Engineer").build();
        Template template = Template.builder()
                .id(10L)
                .job(job)
                .evaluationType(EvaluationType.ANNUAL)
                .criteria(List.of(new Criterion("Code Quality", "Assess code quality")))
                .build();
        job = Job.builder().id(1L).title("Junior Software Engineer").templates(List.of(template)).build();
        template.setJob(job);

        when(jobService.getAllJobsWithTemplates()).thenReturn(List.of(job));
        when(templateMapper.toJobTemplatesDto(job)).thenReturn(new JobTemplatesDTO(
                1L,
                "Junior Software Engineer",
                List.of(new TemplateDTO(
                        10L,
                        1L,
                        EvaluationType.ANNUAL,
                        List.of(new CriterionDTO("Code Quality", "Assess code quality"))))));

        mockMvc.perform(get("/jobs/with-templates"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("Junior Software Engineer"))
                .andExpect(jsonPath("$[0].templates[0].id").value(10))
                .andExpect(jsonPath("$[0].templates[0].evaluationType").value("ANNUAL"));

        verify(jobService).getAllJobsWithTemplates();
    }
}
