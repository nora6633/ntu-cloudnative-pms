package edu.ntu.pms.template.controller;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.*;
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
import edu.ntu.pms.common.ResourceNotFoundException;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.template.dto.CriterionDTO;
import edu.ntu.pms.template.dto.TemplateDTO;
import edu.ntu.pms.template.entity.Criterion;
import edu.ntu.pms.template.mapper.TemplateMapper;
import edu.ntu.pms.template.entity.Template;
import edu.ntu.pms.template.service.TemplateService;
import edu.ntu.pms.user.entity.Job;

@WebMvcTest(TemplateController.class)
@AutoConfigureMockMvc(addFilters = false)
class TemplateControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TemplateService templateService;

    @MockitoBean
    private TemplateMapper templateMapper;

    @MockitoBean
    private JwtService jwtService;

    @Test
    void getAllTemplateByJobId_returnsOkAndJson() throws Exception {
        Job job = Job.builder().id(1L).title("Junior Software Engineer").build();
        Template template = Template.builder()
                .id(10L)
                .job(job)
                .evaluationType(EvaluationType.ANNUAL)
                .criteria(List.of(
                        new Criterion("Code Quality", "Assess code quality"),
                        new Criterion("Team Collaboration", "Assess teamwork")))
                .build();

        when(templateService.getAllTemplatesByJobId(1L)).thenReturn(List.of(template));
        when(templateMapper.toTemplateDto(template)).thenReturn(new TemplateDTO(
                10L,
                1L,
                EvaluationType.ANNUAL,
                List.of(
                        new CriterionDTO("Code Quality", "Assess code quality"),
                        new CriterionDTO("Team Collaboration", "Assess teamwork"))));

        mockMvc.perform(get("/templates/jobs/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].jobId").value(1))
                .andExpect(jsonPath("$[0].evaluationType").value("ANNUAL"))
                .andExpect(jsonPath("$[0].criteria[0].title").value("Code Quality"));

        verify(templateService).getAllTemplatesByJobId(1L);
    }

    @Test
    void getAllTemplateByJobId_whenJobMissing_returnsNotFound() throws Exception {
        when(templateService.getAllTemplatesByJobId(999L))
                .thenThrow(new ResourceNotFoundException("Job", 999L));

        mockMvc.perform(get("/templates/jobs/999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.title").value("Resource Not Found"))
                .andExpect(jsonPath("$.detail").value(containsString("Job with ID 999 not found")));

        verify(templateService).getAllTemplatesByJobId(999L);
    }
}
