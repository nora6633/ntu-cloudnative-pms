package edu.ntu.pms.evaluation.enums;

import static edu.ntu.pms.evaluation.enums.EvaluationStatus.*;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;

import java.util.Set;
import java.util.stream.Stream;
import java.util.stream.Collectors;
import java.util.EnumSet;

import static org.junit.jupiter.api.Assertions.*;

public class EvaluationStatusTests {

    private static Stream<Arguments> allowedTransitions() {
        return Stream.of(
                Arguments.of(INITIAL, PENDING_GOAL_APPROVAL),
                Arguments.of(PENDING_GOAL_APPROVAL, INITIAL),
                Arguments.of(PENDING_GOAL_APPROVAL, WORKING),
                Arguments.of(WORKING, REVIEW),
                Arguments.of(REVIEW, PENDING_REVIEW_CONFIRMATION),
                Arguments.of(PENDING_REVIEW_CONFIRMATION, REVIEW),
                Arguments.of(PENDING_REVIEW_CONFIRMATION, PENDING_CLOSURE),
                Arguments.of(PENDING_CLOSURE, REVIEW),
                Arguments.of(PENDING_CLOSURE, CLOSED));
    }

    private static Stream<Arguments> disallowedTransitions() {
        Set<String> allowed = allowedTransitions()
                .map(args -> args.get()[0] + "->" + args.get()[1])
                .collect(Collectors.toSet());

        return EnumSet.allOf(EvaluationStatus.class).stream()
                .flatMap(from -> EnumSet.allOf(EvaluationStatus.class).stream()
                        .map(to -> Arguments.of(from, to)))
                .filter(a -> !allowed.contains(a.get()[0] + "->" + a.get()[1]));
    }

    @ParameterizedTest(name = "allowed: {0} -> {1}")
    @MethodSource("allowedTransitions")
    void allowedTransitions_doNotThrow(EvaluationStatus from, EvaluationStatus to) {
        assertDoesNotThrow(() -> from.assertCanTransitionTo(to),
                () -> "Expected allowed transition " + from + " -> " + to);
    }

    @ParameterizedTest(name = "disallowed: {0} -> {1}")
    @MethodSource("disallowedTransitions")
    void disallowedTransitions_throw(EvaluationStatus from, EvaluationStatus to) {
        assertThrows(IllegalStateException.class,
                () -> from.assertCanTransitionTo(to),
                () -> "Expected disallowed transition " + from + " -> " + to);
    }
}