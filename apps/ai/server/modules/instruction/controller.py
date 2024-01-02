from fastapi import APIRouter, Depends, Security, status
from fastapi.security import APIKeyHeader, HTTPBearer

from modules.instruction.models.requests import InstructionRequest
from modules.instruction.models.responses import InstructionResponse
from modules.instruction.service import InstructionService
from utils.auth import Authorize, VerifyToken, get_api_key

router = APIRouter(
    prefix="/api/instructions",
    responses={404: {"description": "Not found"}},
)

ac_router = APIRouter(
    prefix="/instructions",
    responses={404: {"description": "Not found"}},
)

token_auth_scheme = HTTPBearer()

api_key_header = APIKeyHeader(name="X-API-Key")
authorize = Authorize()
instruction_service = InstructionService()


@router.get("")
async def get_instructions(
    db_connection_id: str,
    api_key: str = Security(get_api_key),
) -> list[InstructionResponse]:
    org_id = api_key.organization_id
    return instruction_service.get_instructions(db_connection_id, org_id)


@router.get("/{id}")
async def get_instruction(
    id: str, api_key: str = Security(get_api_key)
) -> InstructionResponse:
    org_id = api_key.organization_id
    return instruction_service.get_instruction(id, org_id)


@router.post("", status_code=status.HTTP_201_CREATED)
async def add_instructions(
    instruction_request: InstructionRequest,
    api_key: str = Security(get_api_key),
) -> InstructionResponse:
    return await instruction_service.add_instruction(
        instruction_request, api_key.organization_id
    )


@router.put("/{id}")
async def update_instruction(
    id: str,
    instruction_request: InstructionRequest,
    api_key: str = Security(get_api_key),
) -> InstructionResponse:
    return await instruction_service.update_instruction(
        id, instruction_request, api_key.organization_id
    )


@router.delete("/{id}")
async def delete_instruction(
    id: str,
    api_key: str = Security(get_api_key),
):
    return await instruction_service.delete_instruction(id, api_key.organization_id)


@ac_router.get("")
async def ac_get_instructions(
    db_connection_id: str,
    token: str = Depends(token_auth_scheme),
) -> list[InstructionResponse]:
    user = authorize.user(VerifyToken(token.credentials).verify())
    return instruction_service.get_instructions(db_connection_id, user.organization_id)


@ac_router.get("/{id}")
async def ac_get_instruction(
    id: str,
    token: str = Depends(token_auth_scheme),
) -> InstructionResponse:
    user = authorize.user(VerifyToken(token.credentials).verify())
    return instruction_service.get_instruction(id, user.organization_id)


@ac_router.get("/first")
async def ac_get_first_instruction(
    token: str = Depends(token_auth_scheme),
) -> InstructionResponse:
    user = authorize.user(VerifyToken(token.credentials).verify())
    return instruction_service.get_first_instruction(user.organization_id)


@ac_router.post("", status_code=status.HTTP_201_CREATED)
async def ac_add_instructions(
    instruction_request: InstructionRequest,
    token: str = Depends(token_auth_scheme),
) -> InstructionResponse:
    user = authorize.user(VerifyToken(token.credentials).verify())
    return await instruction_service.add_instruction(
        instruction_request, user.organization_id
    )


@ac_router.put("/{id}")
async def ac_update_instruction(
    id: str,
    instruction_request: InstructionRequest,
    token: str = Depends(token_auth_scheme),
) -> InstructionResponse:
    user = authorize.user(VerifyToken(token.credentials).verify())
    return await instruction_service.update_instruction(
        id, instruction_request, user.organization_id
    )


@ac_router.delete("/{id}")
async def ac_delete_instruction(
    id: str,
    token: str = Depends(token_auth_scheme),
):
    user = authorize.user(VerifyToken(token.credentials).verify())
    return await instruction_service.delete_instruction(id, user.organization_id)
