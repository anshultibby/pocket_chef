import logging

from fastapi import Request

logger = logging.getLogger(__name__)


async def log_request_middleware(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    logger.info(f"Headers: {dict(request.headers)}")

    if request.method == "POST":
        try:
            # Try to read form data for multipart requests
            if request.headers.get("content-type", "").startswith(
                "multipart/form-data"
            ):
                form = await request.form()
                logger.info(f"Form data keys: {list(form.keys())}")
                if "file" in form:
                    file = form["file"]
                    logger.info(
                        f"File details - filename: {file.filename}, content_type: {file.content_type}"
                    )
            else:
                body = await request.body()
                logger.info(f"Request body size: {len(body)} bytes")
        except Exception as e:
            logger.error(f"Error reading request data: {str(e)}")

    response = await call_next(request)
    logger.info(f"Response status: {response.status_code}")
    return response
