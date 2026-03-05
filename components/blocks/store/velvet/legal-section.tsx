"use client"

import type { ComponentConfig } from "@measured/puck"

import { EditableText } from "@/components/demo/editable"
import { demoKey } from "@/components/demo/demo-helpers"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  getLegalIcon,
  normalizeListItems,
  normalizeStringItems,
  type LegalListItem,
  type StringItem,
} from "@/components/blocks/store/velvet/shared/legal-helpers"
import { LegalCallouts, type LegalCallout } from "@/components/blocks/store/velvet/shared/legal-callouts"

type LegalColumn = {
  heading: string
  items: Array<LegalListItem | StringItem>
}

type LegalListGroup = {
  intro?: string
  items: Array<LegalListItem | StringItem>
}

type LegalCard = {
  icon: string
  title: string
  body: string
}

type LegalTableRow = {
  cells: StringItem[]
}

type LegalTable = {
  headers: StringItem[]
  rows: LegalTableRow[]
}

type LegalSubsection = {
  heading: string
  paragraphs: StringItem[]
  items: Array<LegalListItem | StringItem>
  outroParagraphs?: StringItem[]
}

type LegalContactItem = {
  icon: string
  href: string
  text: string
}

type LegalAddress = {
  orgName?: string
  label?: string
  lines: StringItem[]
}

export type LegalSectionProps = {
  id?: string
  sectionId: string
  title: string
  icon: string
  introParagraphs: StringItem[]
  table?: LegalTable
  cards: LegalCard[]
  listGroups: LegalListGroup[]
  listItems: Array<LegalListItem | StringItem>
  outroParagraphs: StringItem[]
  columns: LegalColumn[]
  contactItems: LegalContactItem[]
  address: LegalAddress
  subsections: LegalSubsection[]
  callouts: LegalCallout[]
  sectionClassName: string
  contentClassName: string
  paddingClassName: string
}

export function LegalSection(props: LegalSectionProps) {
  const key = (path: string) => demoKey(props.id, path)
  const Icon = getLegalIcon(props.icon)
  const introParagraphs = normalizeStringItems(props.introParagraphs)
  const tableHeaders = normalizeStringItems(props.table?.headers)
  const tableRows = (props.table?.rows || []).map((row) => normalizeStringItems(row.cells))
  const showTable = tableHeaders.length > 0 && tableRows.length > 0
  const cards = props.cards || []
  const listGroups = props.listGroups || []
  const listItems = normalizeListItems(props.listItems)
  const outroParagraphs = normalizeStringItems(props.outroParagraphs)
  const columns = props.columns || []
  const contactItems = props.contactItems || []
  const subsections = props.subsections || []
  const callouts = props.callouts || []
  const addressLines = normalizeStringItems(props.address?.lines)

  return (
    <section id={props.sectionId} className={cn("scroll-mt-28", props.sectionClassName)}>
      <Card className="rounded-2xl border bg-card">
        <CardContent className={cn("space-y-4", props.paddingClassName, props.contentClassName)}>
          <div className="flex items-center gap-2">
            {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
            <h2 className="text-xl font-semibold text-foreground">
              <EditableText demoKey={key(`legal.sections.${props.sectionId}.title`)} value={props.title} as="span" showIcon={false} />
            </h2>
          </div>

          {introParagraphs.map((paragraph, index) => (
            <p key={index} className="text-sm text-muted-foreground">
              <EditableText
                demoKey={key(`legal.sections.${props.sectionId}.introParagraphs.${index}`)}
                value={paragraph}
                as="span"
                multiline
                showIcon={false}
              />
            </p>
          ))}

          {showTable ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    {tableHeaders.map((header, index) => (
                      <th key={index} className="px-4 py-3 text-left font-medium">
                        <EditableText
                          demoKey={key(`legal.sections.${props.sectionId}.table.headers.${index}`)}
                          value={header}
                          as="span"
                          showIcon={false}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tableRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-4 py-3 text-muted-foreground">
                          <EditableText
                            demoKey={key(`legal.sections.${props.sectionId}.table.rows.${rowIndex}.cells.${cellIndex}`)}
                            value={cell}
                            as="span"
                            showIcon={false}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {cards.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {cards.map((card, index) => {
                const CardIcon = getLegalIcon(card.icon)
                return (
                  <div key={index} className="rounded-xl border bg-muted/30 p-4">
                    <div className="flex items-center gap-2">
                      {CardIcon ? <CardIcon className="h-4 w-4 text-primary" /> : null}
                      <h3 className="text-sm font-semibold text-foreground">
                        <EditableText
                          demoKey={key(`legal.sections.${props.sectionId}.cards.${index}.title`)}
                          value={card.title}
                          as="span"
                          showIcon={false}
                        />
                      </h3>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      <EditableText
                        demoKey={key(`legal.sections.${props.sectionId}.cards.${index}.body`)}
                        value={card.body}
                        as="span"
                        multiline
                        showIcon={false}
                      />
                    </p>
                  </div>
                )
              })}
            </div>
          ) : null}

          {addressLines.length ? (
            <div className="text-sm text-muted-foreground">
              {props.address?.orgName ? (
                <p className="font-medium text-foreground">
                  <EditableText
                    demoKey={key(`legal.sections.${props.sectionId}.address.orgName`)}
                    value={props.address.orgName}
                    as="span"
                    showIcon={false}
                  />
                </p>
              ) : null}
              {props.address?.label ? (
                <p className={cn("text-muted-foreground", props.address.orgName ? "mt-2" : "")}> 
                  <EditableText
                    demoKey={key(`legal.sections.${props.sectionId}.address.label`)}
                    value={props.address.label}
                    as="span"
                    showIcon={false}
                  />
                </p>
              ) : null}
              <address className="not-italic text-muted-foreground">
                {addressLines.map((line, index) => (
                  <span key={index}>
                    <EditableText
                      demoKey={key(`legal.sections.${props.sectionId}.address.lines.${index}`)}
                      value={line}
                      as="span"
                      showIcon={false}
                    />
                    <br />
                  </span>
                ))}
              </address>
            </div>
          ) : null}

          {contactItems.length ? (
            <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
              {contactItems.map((item, index) => {
                const ItemIcon = getLegalIcon(item.icon)
                return (
                  <div key={index} className="flex items-center gap-2">
                    {ItemIcon ? <ItemIcon className="h-4 w-4 text-primary" /> : null}
                    <a href={item.href} className="underline underline-offset-4">
                      <EditableText
                        demoKey={key(`legal.sections.${props.sectionId}.contactItems.${index}.text`)}
                        value={item.text}
                        as="span"
                        showIcon={false}
                      />
                    </a>
                  </div>
                )
              })}
            </div>
          ) : null}

          {columns.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {columns.map((column, columnIndex) => (
                <div key={columnIndex} className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    <EditableText
                      demoKey={key(`legal.sections.${props.sectionId}.columns.${columnIndex}.heading`)}
                      value={column.heading}
                      as="span"
                      showIcon={false}
                    />
                  </p>
                  <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                    {normalizeListItems(column.items).map((item, itemIndex) => (
                      <li key={itemIndex}>
                        {item.label ? (
                          <span className="font-medium text-foreground">
                            <EditableText
                              demoKey={key(`legal.sections.${props.sectionId}.columns.${columnIndex}.items.${itemIndex}.label`)}
                              value={item.label}
                              as="span"
                              showIcon={false}
                            />
                          </span>
                        ) : null}
                        {item.label ? " " : null}
                        <EditableText
                          demoKey={key(`legal.sections.${props.sectionId}.columns.${columnIndex}.items.${itemIndex}.text`)}
                          value={item.text}
                          as="span"
                          showIcon={false}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {subsections.length ? (
            <div className="space-y-4">
              {subsections.map((subsection, subsectionIndex) => (
                <div key={subsectionIndex} className="space-y-3">
                  <h3 className="text-lg font-semibold text-foreground">
                    <EditableText
                      demoKey={key(`legal.sections.${props.sectionId}.subsections.${subsectionIndex}.heading`)}
                      value={subsection.heading}
                      as="span"
                      showIcon={false}
                    />
                  </h3>
                  {normalizeStringItems(subsection.paragraphs).map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="text-sm text-muted-foreground">
                      <EditableText
                        demoKey={key(`legal.sections.${props.sectionId}.subsections.${subsectionIndex}.paragraphs.${paragraphIndex}`)}
                        value={paragraph}
                        as="span"
                        multiline
                        showIcon={false}
                      />
                    </p>
                  ))}
                  {normalizeListItems(subsection.items).length ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      {normalizeListItems(subsection.items).map((item, itemIndex) => (
                        <li key={itemIndex}>
                          {item.label ? (
                            <span className="font-medium text-foreground">
                              <EditableText
                                demoKey={key(`legal.sections.${props.sectionId}.subsections.${subsectionIndex}.items.${itemIndex}.label`)}
                                value={item.label}
                                as="span"
                                showIcon={false}
                              />
                            </span>
                          ) : null}
                          {item.label ? " " : null}
                          <EditableText
                            demoKey={key(`legal.sections.${props.sectionId}.subsections.${subsectionIndex}.items.${itemIndex}.text`)}
                            value={item.text}
                            as="span"
                            showIcon={false}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {normalizeStringItems(subsection.outroParagraphs).map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="text-sm text-muted-foreground">
                      <EditableText
                        demoKey={key(
                          `legal.sections.${props.sectionId}.subsections.${subsectionIndex}.outroParagraphs.${paragraphIndex}`,
                        )}
                        value={paragraph}
                        as="span"
                        multiline
                        showIcon={false}
                      />
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ) : null}

          {listGroups.length ? (
            <div className="space-y-4">
              {listGroups.map((group, groupIndex) => (
                <div key={groupIndex} className="space-y-2">
                  {group.intro ? (
                    <p className="text-sm text-muted-foreground">
                      <EditableText
                        demoKey={key(`legal.sections.${props.sectionId}.listGroups.${groupIndex}.intro`)}
                        value={group.intro}
                        as="span"
                        multiline
                        showIcon={false}
                      />
                    </p>
                  ) : null}
                  {normalizeListItems(group.items).length ? (
                    <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                      {normalizeListItems(group.items).map((item, itemIndex) => (
                        <li key={itemIndex}>
                          {item.label ? (
                            <span className="font-medium text-foreground">
                              <EditableText
                                demoKey={key(
                                  `legal.sections.${props.sectionId}.listGroups.${groupIndex}.items.${itemIndex}.label`,
                                )}
                                value={item.label}
                                as="span"
                                showIcon={false}
                              />
                            </span>
                          ) : null}
                          {item.label ? " " : null}
                          <EditableText
                            demoKey={key(
                              `legal.sections.${props.sectionId}.listGroups.${groupIndex}.items.${itemIndex}.text`,
                            )}
                            value={item.text}
                            as="span"
                            showIcon={false}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {listItems.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              {listItems.map((item, index) => (
                <li key={index}>
                  {item.label ? (
                    <span className="font-medium text-foreground">
                      <EditableText
                        demoKey={key(`legal.sections.${props.sectionId}.listItems.${index}.label`)}
                        value={item.label}
                        as="span"
                        showIcon={false}
                      />
                    </span>
                  ) : null}
                  {item.label ? " " : null}
                  <EditableText
                    demoKey={key(`legal.sections.${props.sectionId}.listItems.${index}.text`)}
                    value={item.text}
                    as="span"
                    showIcon={false}
                  />
                </li>
              ))}
            </ul>
          ) : null}

          {outroParagraphs.map((paragraph, index) => (
            <p key={index} className="text-sm text-muted-foreground">
              <EditableText
                demoKey={key(`legal.sections.${props.sectionId}.outroParagraphs.${index}`)}
                value={paragraph}
                as="span"
                multiline
                showIcon={false}
              />
            </p>
          ))}

          <LegalCallouts callouts={callouts} sectionId={props.sectionId} keyPrefix={key} />
        </CardContent>
      </Card>
    </section>
  )
}

export const legalSectionConfig: ComponentConfig<LegalSectionProps> = {
  fields: {
    sectionId: { type: "text" },
    title: { type: "text" },
    icon: { type: "text" },
    introParagraphs: { type: "array", arrayFields: { value: { type: "textarea" } } },
    table: {
      type: "object",
      objectFields: {
        headers: { type: "array", arrayFields: { value: { type: "text" } } },
        rows: {
          type: "array",
          arrayFields: {
            cells: { type: "array", arrayFields: { value: { type: "textarea" } } },
          },
        },
      },
    },
    cards: {
      type: "array",
      arrayFields: {
        icon: { type: "text" },
        title: { type: "text" },
        body: { type: "textarea" },
      },
    },
    listGroups: {
      type: "array",
      arrayFields: {
        intro: { type: "textarea" },
        items: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            text: { type: "textarea" },
          },
        },
      },
    },
    listItems: {
      type: "array",
      arrayFields: {
        label: { type: "text" },
        text: { type: "textarea" },
      },
    },
    outroParagraphs: { type: "array", arrayFields: { value: { type: "textarea" } } },
    columns: {
      type: "array",
      arrayFields: {
        heading: { type: "text" },
        items: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            text: { type: "text" },
          },
        },
      },
    },
    contactItems: {
      type: "array",
      arrayFields: {
        icon: { type: "text" },
        href: { type: "text" },
        text: { type: "text" },
      },
    },
    address: {
      type: "object",
      objectFields: {
        orgName: { type: "text" },
        label: { type: "text" },
        lines: { type: "array", arrayFields: { value: { type: "text" } } },
      },
    },
    subsections: {
      type: "array",
      arrayFields: {
        heading: { type: "text" },
        paragraphs: { type: "array", arrayFields: { value: { type: "textarea" } } },
        outroParagraphs: { type: "array", arrayFields: { value: { type: "textarea" } } },
        items: {
          type: "array",
          arrayFields: {
            label: { type: "text" },
            text: { type: "textarea" },
          },
        },
      },
    },
    callouts: {
      type: "array",
      arrayFields: {
        title: { type: "text" },
        lines: { type: "array", arrayFields: { value: { type: "text" } } },
        link: {
          type: "object",
          objectFields: {
            prefix: { type: "text" },
            label: { type: "text" },
            href: { type: "text" },
          },
        },
      },
    },
    sectionClassName: { type: "text" },
    contentClassName: { type: "text" },
    paddingClassName: { type: "text" },
  },
  defaultProps: {
    sectionId: "",
    title: "",
    icon: "",
    introParagraphs: [],
    table: { headers: [], rows: [] },
    cards: [],
    listGroups: [],
    listItems: [],
    outroParagraphs: [],
    columns: [],
    contactItems: [],
    address: {
      orgName: "",
      label: "",
      lines: [],
    },
    subsections: [],
    callouts: [],
    sectionClassName: "",
    contentClassName: "",
    paddingClassName: "p-6",
  },
  render: (props) => <LegalSection {...props} />,
}
