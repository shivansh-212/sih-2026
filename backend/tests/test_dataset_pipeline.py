"""
Tests for dataset upload, ingestion, normalization, and matching workflow.
"""

def test_admin_upload_and_process_dataset(client, admin_headers):
    """Test the complete dataset upload and processing pipeline."""
    # 1. Upload a CSV dataset (Google format)
    csv_content = (
        "id,locality,sub_district,district,state,pincode,lat,lng\n"
        "G101,Gomti Nagar,Lucknow East,Lucknow,Uttar Pradesh,226010,26.8500,80.9500\n"
        "G102,Hazratganj,Lucknow Central,Lucknow,Uttar Pradesh,226001,26.8467,80.9462\n"
    ).encode("utf-8")

    upload_resp = client.post(
        "/api/v1/admin/datasets/upload",
        headers=admin_headers,
        files={"file": ("google_sample.csv", csv_content, "text/csv")},
        data={"source": "GOOGLE"},
    )
    assert upload_resp.status_code == 201
    upload_data = upload_resp.json()
    assert upload_data["success"] is True
    assert upload_data["record_count"] == 2
    dataset_id = upload_data["dataset_id"]

    # 2. Process the dataset
    process_resp = client.post(
        f"/api/v1/admin/datasets/{dataset_id}/process",
        headers=admin_headers,
    )
    assert process_resp.status_code == 200
    process_data = process_resp.json()
    assert process_data["success"] is True
    assert process_data["records_processed"] == 2
    assert process_data["records_normalized"] == 2

    # 3. Upload a second dataset (SVAMITVA format)
    svamitva_csv = (
        "property_id,village_name,block_name,district_name,state_name,pin_code,lat,lon\n"
        "SV201,Gomti Nagar,Lucknow East,Lucknow,Uttar Pradesh,226010,26.8501,80.9501\n"
    ).encode("utf-8")

    upload_resp2 = client.post(
        "/api/v1/admin/datasets/upload",
        headers=admin_headers,
        files={"file": ("svamitva_sample.csv", svamitva_csv, "text/csv")},
        data={"source": "SVAMITVA"},
    )
    assert upload_resp2.status_code == 201
    dataset_id2 = upload_resp2.json()["dataset_id"]

    process_resp2 = client.post(
        f"/api/v1/admin/datasets/{dataset_id2}/process",
        headers=admin_headers,
    )
    assert process_resp2.status_code == 200

    # 4. Trigger AI matching pipeline
    match_resp = client.post(
        "/api/v1/admin/matching/trigger",
        headers=admin_headers,
    )
    assert match_resp.status_code == 200
    match_data = match_resp.json()
    assert match_data["success"] is True
    assert match_data["pairs_evaluated"] >= 1
    assert match_data["matched"] >= 1

    # 5. Search for properties created
    props_resp = client.get(
        "/api/v1/properties/search?village=Gomti",
        headers=admin_headers,
    )
    assert props_resp.status_code == 200
    props_data = props_resp.json()
    assert props_data["pagination"]["total_items"] >= 1
    prop = props_data["data"][0]
    assert prop["village"] == "Gomti Nagar"
    assert prop["status"] in ("VERIFIED", "WARNING")
