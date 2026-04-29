package edu.ntu.pms.evaluation.enums;

import edu.ntu.pms.evaluation.entity.Evaluation;

public enum EvaluationStatus implements EvaluationStateHandler {
    INITIAL {
        @Override
        public void assertIsInitial(Evaluation eval) {
            // no-op: this state represents INITIAL so the assertion passes
        }
        @Override
        public void handleSubmit(Evaluation eval) {
            eval.setStatus(PENDING_GOAL_APPROVAL);
        }
    },
    PENDING_GOAL_APPROVAL {
        @Override
        public void assertIsPendingGoalApproval(Evaluation eval) {
            // no-op: this state represents PENDING_GOAL_APPROVAL
        }
        @Override
        public void handleApprove(Evaluation eval) {
            eval.setStatus(WORKING);
        }
        
        @Override
        public void handleReject(Evaluation eval) {
            eval.setStatus(INITIAL);
        }
    },
    WORKING {
        @Override
        public void assertIsWorking(Evaluation eval) {
            // no-op: this state represents WORKING
        }
        @Override
        public void handleSubmit(Evaluation eval) {
            eval.setStatus(REVIEW);
        }
    },
    REVIEW {
        @Override
        public void handleSubmit(Evaluation eval) {
            eval.setStatus(PENDING_REVIEW_CONFIRMATION);
        }
        @Override
        public void assertIsReview(Evaluation eval) {
            // no-op: this state represents REVIEW so the assertion passes
        }
    },
    PENDING_REVIEW_CONFIRMATION {
        @Override
        public void assertIsPendingReviewConfirmation(Evaluation eval) {
            // no-op: this state represents PENDING_REVIEW_CONFIRMATION
        }
        @Override
        public void handleApprove(Evaluation eval) {
            eval.setStatus(PENDING_CLOSURE);
        }

        @Override
        public void handleReject(Evaluation eval) {
            eval.setStatus(REVIEW);
        }
    },
    PENDING_CLOSURE {
        @Override
        public void assertIsPendingClosure(Evaluation eval) {
            // no-op: this state represents PENDING_CLOSURE
        }
        @Override
        public void handleApprove(Evaluation eval) {
            eval.setStatus(CLOSED);
        }

        @Override
        public void handleReject(Evaluation eval) {
            eval.setStatus(REVIEW);
        }
    },
    CLOSED {
        // No transitions allowed from CLOSED
    }
}
