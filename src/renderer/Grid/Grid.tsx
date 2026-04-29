import React, { memo, ReactElement, useState, useCallback, useEffect } from "react";
import List from "@mui/material/List";
import Row from "./Row";
import Group from "./Group";
import { useThrottledCallback } from "../utils/throttle";
import "./Grid.scss";
import {
  ContextMenu,
  Filters,
  HeadersObject,
  PromptItem,
  SettingStore,
  TodoData,
  TodoObject,
} from "../../@types";

const { ipcRenderer } = window.api;

interface GridComponentProps {
  todoData: TodoData | null;
  filters: Filters | null;
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenu | null>>;
  setTodoObject: React.Dispatch<React.SetStateAction<TodoObject | null>>;
  setPromptItem: React.Dispatch<React.SetStateAction<PromptItem | null>>;
  settings: SettingStore;
  headers: HeadersObject;
  searchString: string | null;
}

const GridComponent: React.FC<GridComponentProps> = memo(
  ({
    todoData,
    filters,
    setDialogOpen,
    setContextMenu,
    setTodoObject,
    setPromptItem,
    settings,
    headers,
    searchString,
  }) => {
    const renderedRowsSet = new Set<number>();
    const [maxRows, setMaxRows] = useState(
      Math.floor(window.innerHeight / 35) * 2,
    );

    const handleKeyUp: React.KeyboardEventHandler = (event): void => {
      if (event.key === "ArrowDown") {
        const listItems =
          document.querySelectorAll<HTMLElement>("li:not(.group)");
        const currentIndex = Array.from<Element>(listItems).indexOf(
          document.activeElement!,
        );
        const nextIndex = currentIndex + 1;
        const nextElement = listItems[nextIndex];
        if (nextElement) {
          nextElement.focus();
        }
      } else if (event.key === "ArrowUp") {
        const listItems =
          document.querySelectorAll<HTMLElement>("li:not(.group)");
        const currentIndex: number = Array.from<Element>(listItems).indexOf(
          document.activeElement!,
        );
        const prevIndex: number = currentIndex - 1;
        const prevElement: HTMLElement = listItems[prevIndex];
        if (prevElement) {
          prevElement.focus();
        }
      } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const closest = (event.target as HTMLElement).closest("li");
        if (!closest) return;
        const rowItems = closest.querySelectorAll<HTMLElement>(
          'button, input, select, a[href], [tabindex]:not([tabindex="-1"])',
        );
        const currentIndex = Array.from<Element>(rowItems).indexOf(
          document.activeElement!,
        );
        const nextIndex =
          event.key === "ArrowRight" ? currentIndex + 1 : currentIndex - 1;
        const nextElement = rowItems[nextIndex];
        if (nextElement) {
          nextElement.focus();
        }
      }
    };

    const handleScroll = useCallback(
      (event: React.UIEvent<HTMLUListElement>): void => {
        const list = event.currentTarget || document.getElementById("grid");
        if (!list) return;

        const scrollTop: number = list.scrollTop;
        const scrollHeight: number = list.scrollHeight - list.clientHeight;
        const scrollRatio: number = scrollHeight > 0 ? scrollTop / scrollHeight : 0;

        if (
          scrollRatio >= 0.85 &&
          maxRows < headers.availableObjects
        ) {
          setMaxRows((prev) => prev + 30);
        }
      },
      [headers.availableObjects, maxRows]
    );

    const throttledHandleScroll = useThrottledCallback(handleScroll, 300);

    // Move IPC call to useEffect - only triggers when maxRows or searchString changes
    useEffect(() => {
      ipcRenderer.send("requestData", searchString);
    }, [maxRows, searchString]);

    if (headers.visibleObjects === 0) return null;

    return (
      <List id="grid" onScroll={throttledHandleScroll} onKeyUp={handleKeyUp}>
        {todoData &&
          todoData.map((group, groupIndex) => {
            if (!group.visible) {
              return null;
            }
            return (() => {
              const result = [] as ReactElement[];

              // Add Group
              result.push(
                <Group
                  key={`group-${groupIndex}-${group.title?.toString()}`}
                  attributeKey={settings.sorting[0].value}
                  value={group.title}
                  filters={filters}
                />,
              );

              // Add rows
              for (let i = 0; i < group.todoObjects.length; i++) {
                const todoObject = group.todoObjects[i];
                if (renderedRowsSet.size >= maxRows) {
                  break;
                } else if (renderedRowsSet.has(todoObject.lineNumber)) {
                  continue;
                }
                renderedRowsSet.add(todoObject.lineNumber);
                result.push(
                  <Row
                    key={`row-${todoObject.lineNumber}`}
                    todoObject={todoObject}
                    filters={filters}
                    setTodoObject={setTodoObject}
                    setDialogOpen={setDialogOpen}
                    setContextMenu={setContextMenu}
                    setPromptItem={setPromptItem}
                    settings={settings}
                  />,
                );
              }

              return result;
            })();
          })}
      </List>
    );
  },
);

GridComponent.displayName = "GridComponent";

export default GridComponent;
