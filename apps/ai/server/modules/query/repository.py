from bson import ObjectId

from config import QUERY_RESPONSE_COL, QUERY_RESPONSE_REF_COL, QUESTION_COL
from database.mongo import DESCENDING, MongoDB
from modules.query.models.entities import EngineResponse, Query, Question
from utils.misc import get_next_display_id


class QueryRepository:
    def get_question(self, question_id: str) -> Question:
        question = MongoDB.find_by_id(QUESTION_COL, ObjectId(question_id))
        return Question(**question) if question else None

    def get_questions(self, question_ids: list[str]) -> list[Question]:
        object_ids = [ObjectId(id) for id in question_ids]
        questions = MongoDB.find_by_object_ids(QUESTION_COL, object_ids)
        return [Question(**question) for question in questions]

    def get_response(self, response_id: str) -> EngineResponse:
        query_response = MongoDB.find_by_object_id(
            QUERY_RESPONSE_COL, ObjectId(response_id)
        )
        return EngineResponse(**query_response) if query_response else None

    def get_responses(self, response_ids: list[str]) -> list[EngineResponse]:
        object_ids = [ObjectId(id) for id in response_ids]
        query_responses = MongoDB.find(QUERY_RESPONSE_COL, {"_id": {"$in": object_ids}})
        return [EngineResponse(**qr) for qr in query_responses]

    def get_query(self, query_id: str) -> Query:
        query = MongoDB.find_one(QUERY_RESPONSE_REF_COL, {"_id": ObjectId(query_id)})
        return Query(**query) if query else None

    def get_queries(
        self, skip: int, limit: int, order: str, org_id: str
    ) -> list[Query]:
        queries = (
            MongoDB.find(QUERY_RESPONSE_REF_COL, {"organization_id": ObjectId(org_id)})
            .sort([(order, DESCENDING)])
            .skip(skip)
            .limit(limit)
        )
        return [Query(**query) for query in queries]

    def add_query(
        self,
        new_query_data: dict,
    ) -> str:
        return str(MongoDB.insert_one(QUERY_RESPONSE_REF_COL, new_query_data))

    def update_query(self, query_id: str, new_query_data: dict) -> int:
        return MongoDB.update_one(
            QUERY_RESPONSE_REF_COL, {"_id": ObjectId(query_id)}, new_query_data
        )

    def get_next_display_id(self, org_id: str) -> str:
        return get_next_display_id(QUERY_RESPONSE_REF_COL, ObjectId(org_id), "QR")
