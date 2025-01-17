from typing import Any, Dict, List, Set


def summarize_schema(schema: dict) -> str:
    """
    Convert a JSON schema into a human-readable format
    """

    def _get_type_str(field_schema: Dict[str, Any], defs: Dict[str, Any]) -> str:
        if "type" in field_schema:
            if field_schema["type"] == "array":
                if "items" in field_schema:
                    item_type = _get_type_str(field_schema["items"], defs)
                    return f"List[{item_type}]"
                return "List"
            return field_schema["type"]
        elif "$ref" in field_schema:
            ref_path = field_schema["$ref"].split("/")
            if ref_path[0] == "#" and ref_path[1] == "$defs":
                # Process the referenced type from $defs
                ref_type = defs.get(ref_path[-1], {})
                return ref_path[-1]  # Return the type name
            return ref_path[-1]
        elif "anyOf" in field_schema:
            types = [_get_type_str(t, defs) for t in field_schema["anyOf"]]
            return " | ".join(types)
        return "Any"

    def _process_properties(
        properties: Dict[str, Any],
        required: Set[str],
        defs: Dict[str, Any],
        prefix: str = "",
        depth: int = 0,
    ) -> List[str]:
        lines = []
        for prop_name, prop_schema in properties.items():
            # Get field type
            field_type = _get_type_str(prop_schema, defs)

            # Get description
            description = prop_schema.get("description", "")

            # Format required/optional
            is_required = prop_name in required
            req_str = "" if is_required else "optional "

            # Format line with proper indentation
            indent = "  " * depth
            line = f"{indent}{prefix}{prop_name}: {req_str}{field_type}"
            if description:
                line += f" - {description}"
            lines.append(line)

            # Handle nested objects directly defined in properties
            if "properties" in prop_schema:
                nested_required = set(prop_schema.get("required", []))
                nested_lines = _process_properties(
                    prop_schema["properties"],
                    nested_required,
                    defs,
                    prefix=f"{prefix}{prop_name}.",
                    depth=depth + 1,
                )
                lines.extend(nested_lines)

        return lines

    # Process all definitions first
    defs = schema.get("$defs", {})
    lines = []

    for def_name, def_schema in defs.items():
        lines.append(f"\n# {def_name} Definition:")
        if "properties" in def_schema:
            required_fields = set(def_schema.get("required", []))
            def_lines = _process_properties(
                def_schema["properties"],
                required_fields,
                defs,
                depth=1,
            )
            lines.extend(def_lines)

    # Process the root schema
    lines.append("\n# Root Schema:")
    required_fields = set(schema.get("required", []))
    root_lines = _process_properties(
        schema["properties"],
        required_fields,
        defs,
        depth=1,
    )
    lines.extend(root_lines)

    # Add header
    header = "Schema Definition:"
    separator = "-" * len(header)

    return "\n".join([header, separator] + lines)


def get_example_value(field_schema: Dict[str, Any]) -> Any:
    """
    Generate an example value for a schema field
    """
    if "example" in field_schema:
        return field_schema["example"]

    field_type = field_schema.get("type")
    if field_type == "string":
        return "example"
    elif field_type == "number":
        return 0.0
    elif field_type == "integer":
        return 0
    elif field_type == "boolean":
        return True
    elif field_type == "array":
        item_schema = field_schema.get("items", {})
        return [get_example_value(item_schema)]
    elif field_type == "object":
        return {
            k: get_example_value(v)
            for k, v in field_schema.get("properties", {}).items()
        }
    return None


def generate_example(schema: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate an example object from a schema
    """
    return {
        prop_name: get_example_value(prop_schema)
        for prop_name, prop_schema in schema["properties"].items()
    }
