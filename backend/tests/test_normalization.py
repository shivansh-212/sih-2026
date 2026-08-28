"""
Tests for normalization utilities.
"""

from app.utils.normalization import (
    normalize_pincode,
    normalize_village,
    normalize_block,
    normalize_district,
    normalize_state,
    validate_latitude,
    validate_longitude,
    normalize_record,
)


class TestNormalizePincode:
    def test_valid_pincode(self):
        assert normalize_pincode("226001") == "226001"

    def test_pincode_with_whitespace(self):
        assert normalize_pincode("  226001  ") == "226001"

    def test_invalid_pincode_too_short(self):
        assert normalize_pincode("2260") is None

    def test_invalid_pincode_letters(self):
        assert normalize_pincode("abc123") is None

    def test_none_pincode(self):
        assert normalize_pincode(None) is None

    def test_empty_pincode(self):
        assert normalize_pincode("") is None


class TestNormalizeVillage:
    def test_title_case(self):
        assert normalize_village("gomti nagar") == "Gomti Nagar"

    def test_whitespace_collapse(self):
        assert normalize_village("gomti   nagar") == "Gomti Nagar"

    def test_trim(self):
        assert normalize_village("  gomti nagar  ") == "Gomti Nagar"

    def test_none(self):
        assert normalize_village(None) is None

    def test_empty(self):
        assert normalize_village("") is None


class TestNormalizeBlock:
    def test_title_case(self):
        assert normalize_block("lucknow west") == "Lucknow West"

    def test_none(self):
        assert normalize_block(None) is None


class TestNormalizeDistrict:
    def test_title_case(self):
        assert normalize_district("LUCKNOW") == "Lucknow"


class TestNormalizeState:
    def test_title_case(self):
        assert normalize_state("uttar pradesh") == "Uttar Pradesh"


class TestValidateLatitude:
    def test_valid(self):
        assert validate_latitude(26.8467) == 26.8467

    def test_boundary_min(self):
        assert validate_latitude(-90.0) == -90.0

    def test_boundary_max(self):
        assert validate_latitude(90.0) == 90.0

    def test_out_of_range(self):
        assert validate_latitude(91.0) is None

    def test_none(self):
        assert validate_latitude(None) is None


class TestValidateLongitude:
    def test_valid(self):
        assert validate_longitude(80.9462) == 80.9462

    def test_boundary_min(self):
        assert validate_longitude(-180.0) == -180.0

    def test_boundary_max(self):
        assert validate_longitude(180.0) == 180.0

    def test_out_of_range(self):
        assert validate_longitude(181.0) is None

    def test_none(self):
        assert validate_longitude(None) is None


class TestNormalizeRecord:
    def test_full_record(self):
        result = normalize_record({
            "village": "gomti  nagar",
            "block": "LUCKNOW WEST",
            "district": "lucknow",
            "state": "uttar pradesh",
            "pincode": "226001",
            "latitude": 26.8467,
            "longitude": 80.9462,
        })
        assert result["village"] == "Gomti Nagar"
        assert result["block"] == "Lucknow West"
        assert result["district"] == "Lucknow"
        assert result["state"] == "Uttar Pradesh"
        assert result["pincode"] == "226001"
        assert result["latitude"] == 26.8467
        assert result["longitude"] == 80.9462

    def test_partial_record(self):
        result = normalize_record({"village": "test", "pincode": "invalid"})
        assert result["village"] == "Test"
        assert result["pincode"] is None
        assert result["block"] is None
