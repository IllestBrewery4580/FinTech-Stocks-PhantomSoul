package com.phantomsoul.decision;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public final class DecisionFirewall {
    private DecisionFirewall() {}

    public enum ThesisStatus {
        HEALTHY, REVIEW_REQUIRED, BROKEN, INSUFFICIENT_EVIDENCE
    }

    public enum Action {
        BUY, SELL, HOLD, REDUCE, INCREASE
    }

    public enum Severity {
        REVIEW, BLOCK
    }

    public record TradeRequest(
        String userId,
        String thesisId,
        Action action,
        ThesisStatus thesisStatus,
        String rationale,
        boolean counterargumentsReviewed,
        boolean overrideRequested
    ) {
        public TradeRequest {
            if (userId == null || userId.isBlank()) {
                throw new IllegalArgumentException("userId is required");
            }
            if (thesisId == null || thesisId.isBlank()) {
                throw new IllegalArgumentException("thesisId is required");
            }
            if (action == null || thesisStatus == null) {
                throw new IllegalArgumentException("Action and thesis status are required");
            }
            if (rationale == null || rationale.isBlank()) {
                throw new IllegalArgumentException("Decision rationale is required");
            }
        }
    }

    public record Challenge(String code, Severity severity, String message) {}

    public record DecisionResult(
        String eventId,
        Instant evaluatedAt,
        String userId,
        String thesisId,
        Action action,
        String outcome,
        List<Challenge> challenges,
        String rationale,
        boolean overrideRecorded
    ) {
        public DecisionResult {
            challenges = List.copyOf(challenges);
        }
    }

    public static DecisionResult evaluate(TradeRequest request) {
        List<Challenge> challenges = new ArrayList<>();

        if (request.thesisStatus() == ThesisStatus.BROKEN) {
            challenges.add(new Challenge(
                "THESIS_INVALIDATED",
                Severity.BLOCK,
                "The thesis has been explicitly invalidated."
            ));
        } else if (request.thesisStatus() != ThesisStatus.HEALTHY) {
            challenges.add(new Challenge(
                "THESIS_REVIEW",
                Severity.REVIEW,
                "Thesis health is unresolved and requires review."
            ));
        }

        if (!request.counterargumentsReviewed()) {
            challenges.add(new Challenge(
                "COUNTERARGUMENTS_NOT_REVIEWED",
                Severity.REVIEW,
                "Review the opposing case before proceeding."
            ));
        }

        boolean hardBlock = challenges.stream()
            .anyMatch(challenge -> challenge.severity() == Severity.BLOCK);

        // An override records user intent; it cannot bypass an explicit
        // thesis invalidation.
        boolean overrideRecorded =
            request.overrideRequested() && !challenges.isEmpty() && !hardBlock;

        String outcome;
        if (hardBlock) {
            outcome = "BLOCKED";
        } else if (!challenges.isEmpty() && !request.overrideRequested()) {
            outcome = "BLOCKED";
        } else if (overrideRecorded) {
            outcome = "OVERRIDE_RECORDED";
        } else {
            outcome = "READY";
        }

        return new DecisionResult(
            UUID.randomUUID().toString(),
            Instant.now(),
            request.userId(),
            request.thesisId(),
            request.action(),
            outcome,
            challenges,
            request.rationale().trim(),
            overrideRecorded
        );
    }
}
