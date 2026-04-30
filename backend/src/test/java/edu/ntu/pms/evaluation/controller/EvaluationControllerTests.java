package edu.ntu.pms.evaluation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.List;

import edu.ntu.pms.auth.JwtService;
import edu.ntu.pms.evaluation.dto.EvaluationDTO;
import edu.ntu.pms.evaluation.entity.Evaluation;
import edu.ntu.pms.evaluation.enums.EvaluationStatus;
import edu.ntu.pms.evaluation.enums.EvaluationType;
import edu.ntu.pms.evaluation.mapper.EvaluationMapper;
import edu.ntu.pms.evaluation.service.EvaluationService;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(EvaluationController.class)
@AutoConfigureMockMvc(addFilters = false) // Disable security filters for testing
class EvaluationControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private EvaluationService evaluationService;

    @MockitoBean
    private EvaluationMapper mapper;

    // Mock JwtService to avoid issues with security context during tests
    // The controller itself doesn't directly use JwtService, but it may be required by security filters or other components in the context
    @MockitoBean
    private JwtService jwtService; 

    @Test
    void getMyEvaluations_returnsOkAndJson() throws Exception {
        Evaluation e = Evaluation.builder()
                .cycle("2024")
                .status(EvaluationStatus.INITIAL)
                .type(EvaluationType.ANNUAL)
                .build();

        EvaluationDTO dto = new EvaluationDTO(1L, "2024", EvaluationStatus.INITIAL, EvaluationType.ANNUAL,
                null, null, null, null, 
                null, null,
                null, null, null,
                List.of(), List.of());

        when(evaluationService.getMyEvaluations()).thenReturn(List.of(e));
        when(mapper.toDto(e)).thenReturn(dto);

        mockMvc.perform(get("/evaluations/my-evaluations"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$[0].id").value(1));

        verify(evaluationService, times(1)).getMyEvaluations();
        verify(mapper, times(1)).toDto(e);
    }

    @Test
    void startEvaluationCycle_valid_returnsOk() throws Exception {
        String payload = "{\"cycleName\":\"2024\",\"evaluationType\":\"ANNUAL\",\"jobToTemplateIdMap\":{\"1\":1}}";

        mockMvc.perform(post("/evaluations/start-cycle")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("Evaluation cycle started: 2024")));

        verify(evaluationService, times(1)).startEvaluationCycle(eq("2024"), eq(EvaluationType.ANNUAL), any());
    }

    @Test
    void invalidStartCycle_returnsBadRequest_withValidationErrors() throws Exception {
        // cycleName is blank and jobToTemplateIdMap is empty -> violates @NotBlank and
        // @NotEmpty
        String payload = "{\"cycleName\":\"\",\"evaluationType\":\"ANNUAL\",\"jobToTemplateIdMap\":{}}";

        mockMvc.perform(post("/evaluations/start-cycle")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("Validation Failed"))
                .andExpect(jsonPath("$.errors").isArray());
    }

    @Test
    void draftGoals_withValidPayload_returnsOk() throws Exception {
        String payload = "[{"
                + "\"definition\":\"Def\","
                + "\"metric\":\"M\","
                + "\"resource\":\"R\","
                + "\"relevance\":\"High\","
                + "\"deadline\":\"2099-12-31\","
                + "\"criteria\":[\"c1\"],"
                + "\"progresses\":[]} ]";

        // normalize whitespace for JSON
        payload = payload.replace("\n", "").replace("\r", "");

        mockMvc.perform(post("/evaluations/1/draft-goals")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("Goals drafted successfully")));

        verify(evaluationService, times(1)).draftGoals(eq(1L), any());
    }

    @Test
    void draftReview_withValidPayload_returnsOk() throws Exception {
        String payload = "[{"
                + "\"id\":1,"
                + "\"name\":\"name\","
                + "\"description\":\"des\","
                + "\"rating\":4,"
                + "\"feedback\":\"Good job\"}]";
        
        // normalize whitespace for JSON
        payload = payload.replace("\n", "").replace("\r", "");

        mockMvc.perform(post("/evaluations/1/draft-review")
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("Review drafted successfully")));

        verify(evaluationService, times(1)).draftReview(eq(1L), any());
    }

    @Test
    void submitForGoalApproval_callsService_andReturnsOk() throws Exception {
        mockMvc.perform(post("/evaluations/1/submit-for-goal-approval"))
                .andExpect(status().isOk())
                .andExpect(content().string(Matchers.containsString("Evaluation submitted for goal approval")));

        verify(evaluationService, times(1)).submitForGoalApproval(eq(1L));
    }

    @Test
    void serviceThrowsRuntimeException_resultsInInternalServerError() throws Exception {
        when(evaluationService.getMyEvaluations()).thenThrow(new RuntimeException("boom"));

        mockMvc.perform(get("/evaluations/my-evaluations"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.title").value("Server Error"))
                .andExpect(jsonPath("$.detail").value("An unexpected error occurred on the server."));
    }
}
