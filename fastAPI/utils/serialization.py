from typing import Any, Dict, List
from bson import ObjectId


def to_str_id(value: Any) -> Any:
    if isinstance(value, ObjectId):
        return str(value)
    if isinstance(value, list):
        return [to_str_id(v) for v in value]
    if isinstance(value, dict):
        return {k: to_str_id(v) for k, v in value.items()}
    return value


def normalize_doc(doc: Dict[str, Any] | None) -> Dict[str, Any] | None:
    if doc is None:
        return None
    new_doc = {**doc}
    if "_id" in new_doc:
        new_doc["_id"] = to_str_id(new_doc["_id"])
    return to_str_id(new_doc)


