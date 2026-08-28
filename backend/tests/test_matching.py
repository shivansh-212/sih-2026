"""
Tests for the AI matching service.
"""

from app.utils.geo import haversine_distance
from app.services.matching_service import classify_match, MatchStatus


class TestHaversineDistance:
    def test_same_point(self):
        """Distance between identical points should be ~0."""
        d = haversine_distance(26.8467, 80.9462, 26.8467, 80.9462)
        assert d < 1.0  # less than 1 meter

    def test_known_distance(self):
        """Test a known distance (approx Delhi to Agra ~178km)."""
        d = haversine_distance(28.6139, 77.2090, 27.1767, 78.0081)
        assert 170_000 < d < 220_000  # roughly 178km

    def test_short_distance(self):
        """Two nearby points should be < 1km."""
        d = haversine_distance(26.8467, 80.9462, 26.8477, 80.9472)
        assert d < 2000


class TestClassifyMatch:
    def test_matched(self):
        assert classify_match(85.0) == MatchStatus.MATCHED
        assert classify_match(100.0) == MatchStatus.MATCHED
        assert classify_match(92.5) == MatchStatus.MATCHED

    def test_possible(self):
        assert classify_match(60.0) == MatchStatus.POSSIBLE
        assert classify_match(84.9) == MatchStatus.POSSIBLE
        assert classify_match(72.0) == MatchStatus.POSSIBLE

    def test_rejected(self):
        assert classify_match(0.0) == MatchStatus.REJECTED
        assert classify_match(59.9) == MatchStatus.REJECTED
        assert classify_match(30.0) == MatchStatus.REJECTED


class TestMatchingScores:
    """Test individual score components via direct import."""

    def test_exact_pincode_match(self):
        from app.services.matching_service import _score_pincode, WEIGHTS
        from unittest.mock import MagicMock

        a = MagicMock(pincode="226001")
        b = MagicMock(pincode="226001")
        assert _score_pincode(a, b) == WEIGHTS["pincode_match"]

    def test_different_pincode(self):
        from app.services.matching_service import _score_pincode
        from unittest.mock import MagicMock

        a = MagicMock(pincode="226001")
        b = MagicMock(pincode="226002")
        assert _score_pincode(a, b) == 0.0

    def test_exact_village_match(self):
        from app.services.matching_service import _score_village, WEIGHTS
        from unittest.mock import MagicMock

        a = MagicMock(village="Gomti Nagar")
        b = MagicMock(village="gomti nagar")
        assert _score_village(a, b) == WEIGHTS["village_match"]

    def test_exact_block_match(self):
        from app.services.matching_service import _score_block, WEIGHTS
        from unittest.mock import MagicMock

        a = MagicMock(block="Lucknow West")
        b = MagicMock(block="lucknow west")
        assert _score_block(a, b) == WEIGHTS["block_match"]

    def test_nearby_location(self):
        """Two points 30m apart should get full proximity score."""
        from app.services.matching_service import _score_location_proximity, WEIGHTS
        from unittest.mock import MagicMock
        from decimal import Decimal

        a = MagicMock(latitude=Decimal("26.8467"), longitude=Decimal("80.9462"))
        b = MagicMock(latitude=Decimal("26.84672"), longitude=Decimal("80.94622"))
        score = _score_location_proximity(a, b)
        assert score > WEIGHTS["location_proximity"] * 0.9

    def test_far_location(self):
        """Two points 10km apart should get 0 proximity score."""
        from app.services.matching_service import _score_location_proximity
        from unittest.mock import MagicMock
        from decimal import Decimal

        a = MagicMock(latitude=Decimal("26.8467"), longitude=Decimal("80.9462"))
        b = MagicMock(latitude=Decimal("26.9467"), longitude=Decimal("81.0462"))
        score = _score_location_proximity(a, b)
        assert score == 0.0


class TestPropertyIdGeneration:
    """Test BHU-ID generation."""

    def test_generate_id_format(self):
        from app.services.id_service import generate_property_id

        pid = generate_property_id("Uttar Pradesh", "Lucknow")
        assert pid.startswith("BHU-UP-LUC-")
        assert len(pid) == 19  # BHU-UP-LUC-xxxxxxxx (4+3+4+8 chars)

    def test_generate_id_unknown_state(self):
        from app.services.id_service import generate_property_id

        pid = generate_property_id("Unknown State", "Test")
        assert pid.startswith("BHU-XX-TES-")

    def test_generate_id_no_state(self):
        from app.services.id_service import generate_property_id

        pid = generate_property_id(None, None)
        assert pid.startswith("BHU-XX-UNK-")

    def test_generate_unique_ids(self):
        from app.services.id_service import generate_property_id

        ids = {generate_property_id("Uttar Pradesh", "Lucknow") for _ in range(100)}
        assert len(ids) == 100  # All unique
