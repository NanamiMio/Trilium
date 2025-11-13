import { useEffect, useState } from "preact/hooks";
import "./PromotedAttributes.css";
import { useNoteContext, useNoteLabel } from "./react/hooks";
import { Attribute } from "../services/attribute_parser";
import { ComponentChild } from "preact";
import FAttribute from "../entities/fattribute";
import { t } from "../services/i18n";
import ActionButton from "./react/ActionButton";

export default function PromotedAttributes() {
    const { note } = useNoteContext();
    const [ promotedAttributes, setPromotedAttributes ] = useState<ComponentChild[]>();
    const [ viewType ] = useNoteLabel(note, "viewType");

    useEffect(() => {
        if (!note) {
            setPromotedAttributes([]);
            return;
        }

        const promotedDefAttrs = note.getPromotedDefinitionAttributes();
        const ownedAttributes = note.getOwnedAttributes();
        // attrs are not resorted if position changes after the initial load
        // promoted attrs are sorted primarily by order of definitions, but with multi-valued promoted attrs
        // the order of attributes is important as well
        ownedAttributes.sort((a, b) => a.position - b.position);

        let promotedAttributes: ComponentChild[] = [];
        for (const definitionAttr of promotedDefAttrs) {
            const valueType = definitionAttr.name.startsWith("label:") ? "label" : "relation";
            const valueName = definitionAttr.name.substr(valueType.length + 1);

            let valueAttrs = ownedAttributes.filter((el) => el.name === valueName && el.type === valueType) as Attribute[];

            if (valueAttrs.length === 0) {
                valueAttrs.push({
                    attributeId: "",
                    type: valueType,
                    name: valueName,
                    value: ""
                });
            }

            if (definitionAttr.getDefinition().multiplicity === "single") {
                valueAttrs = valueAttrs.slice(0, 1);
            }

            for (const valueAttr of valueAttrs) {
                promotedAttributes.push(<PromotedAttributeCell
                    noteId={note.noteId}
                    definitionAttr={definitionAttr}
                    valueAttr={valueAttr} valueName={valueName} />)
            }
        }
        setPromotedAttributes(promotedAttributes);
        console.log("Got ", promotedAttributes);
    }, [ note ]);

    return (
        <div className="promoted-attributes-widget">
            {viewType !== "table" && (
                <div className="promoted-attributes-container">
                    {promotedAttributes}
                </div>
            )}
        </div>
    );
}

function PromotedAttributeCell({ noteId, definitionAttr, valueAttr, valueName }: {
    noteId: string;
    definitionAttr: FAttribute;
    valueAttr: Attribute;
    valueName: string;
}) {
    const definition = definitionAttr.getDefinition();
    const id = `value-${valueAttr.attributeId}`;

    return (
        <div className="promoted-attribute-cell">
            <label
                for={id}
            >{definition.promotedAlias ?? valueName}</label>

            <div className="input-group">
                <input
                    className="form-control promoted-attribute-input"
                    tabindex={200 + definitionAttr.position}
                    id={id}
                    // if not owned, we'll force creation of a new attribute instead of updating the inherited one
                    data-attribute-id={valueAttr.noteId === noteId ? valueAttr.attributeId ?? "" : ""}
                    data-attribute-type={valueAttr.type}
                    data-attribute-name={valueAttr.name}
                    value={valueAttr.value}
                    placeholder={t("promoted_attributes.unset-field-placeholder")}
                />
            </div>

            <div />

            {definition.multiplicity === "multi" && (
                <td className="multiplicity">
                    <ActionButton
                        icon="bx bx-plus"
                        className="pointer tn-tool-button"
                        text={t("promoted_attributes.add_new_attribute")}
                        noIconActionClass
                    />

                    <ActionButton
                        icon="bx bx-trash"
                        className="pointer tn-tool-button"
                        text={t("promoted_attributes.remove_this_attribute")}
                        noIconActionClass
                    />
                </td>
            )}
        </div>
    )
}
