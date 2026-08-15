<script lang="ts">
  import { onMount } from "svelte";
  import { type ContentSummary, generateLCPSummary, generateMultiLCPSummary, type LCPData } from "../../util/lcps";
  import { SvelteMap, SvelteSet } from "svelte/reactivity";
  import type { IContentPack } from "../../util/unpacking/packed-types";

  interface Props {
    lcpData: LCPData[];

    onRowHovered: (s: ContentSummary | null) => void;
    onAggregateSummary: (s: ContentSummary | null) => void;
    onImportMany: (p: IContentPack[] | null) => void;
    onClearCompendiums: () => void;

    disabled: boolean;
  }

  let { lcpData, onRowHovered, onAggregateSummary, onImportMany, onClearCompendiums, disabled = false }: Props = $props();

  let selectableRows = new SvelteSet<string>();
  let selectedRows = new SvelteMap<string, boolean>();
  let allRowsSelected = $derived([...selectableRows].every(id => selectedRows.get(id) === true));

  onMount(() => {
    if (typeof lcpData !== "undefined") {
      for (const pack of lcpData) {
        selectedRows.set(pack.id, pack.availableVersion > pack.currentVersion);
        if (Boolean(pack.availableVersion)) selectableRows.add(pack.id);
      }
    }
    aggregateSummary();
  });

  function toggleSelectAllOfficial() {
    const toggle = !allRowsSelected;
    for (const pack of lcpData) {
      if (!selectableRows.has(pack.id)) continue;
      selectedRows.set(pack.id, toggle);
    }
  }

  function toggleRow(packId: string) {
    selectedRows.set(packId, !selectedRows.get(packId));
    aggregateSummary();
  }

  const aggregateManifest = {
    author: "Massif Press",
    name: "Selected Official Sources",
    version: "1.0.0",
    item_prefix: "",
    description: "",
    website: "https://massif-press.itch.io/",
  };
  function generateAggregateSummary() {
    const selected = lcpData.filter(p => selectedRows.get(p.id) === true);
    if (!selected.length) return null;
    if (selected.length === 1) {
      const summary = generateLCPSummary(selected[0].cp);
      summary.aggregate = true;
      return summary;
    }
    return generateMultiLCPSummary(
      aggregateManifest,
      selected.filter(p => Boolean(p.cp)).map(p => p.cp!)
    );
  }

  function aggregateSummary() {
    const summary = generateAggregateSummary();
    onAggregateSummary(summary);
  }

  let hoveredRow: string | null = null;
  function onMouseEnterRow(id: string) {
    hoveredRow = id;
    const rowLcp = lcpData.find(p => p.id === id);
    if (!rowLcp || !rowLcp.cp || !rowLcp.cp.data) {
      onRowHovered(null);
      return;
    }
    const lcpSummary = generateLCPSummary(rowLcp.cp);
    onRowHovered(lcpSummary);
  }

  function onMouseLeaveRow(id: string) {
    setTimeout(() => {
      if (hoveredRow === id) {
        hoveredRow = null;
        onRowHovered(null);
      }
    }, 50);
  }

  function dispatchLCPsToInstall() {
    const selected = lcpData.filter(p => selectedRows.get(p.id));
    onImportMany(selected.flatMap(p => (p.cp ? [p.cp] : [])));
  }
</script>

<div class="lcp-table flexcol">
  <div class="lancer-header clipped-top lancer-primary major">
    Available and Installed Content
  </div>
  <!-- LCP table. Official content is listed first, manually installed content at the end. -->
  <div id="lcp-table">
    <div class="lcp-table__rows">
      <div class="row header">
        <div>
          <input
            class="content-checkbox"
            name="select-all"
            type="checkbox"
            {disabled}
            bind:checked={allRowsSelected}
            onclick={toggleSelectAllOfficial}
            onchange={aggregateSummary}
          >
        </div>
        <span>TITLE</span>
        <span>AUTHOR</span>
        <span></span>
        <span>CURRENT</span>
        <span></span>
        <span>AVAILABLE</span>
      </div>
      {#each lcpData as pack}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <div
          role="button"
          tabindex="-1"
          class={`row${pack.availableVersion ? " has-data" : ""}`}
          onmouseenter={() => onMouseEnterRow(pack.id)}
          onmouseleave={() => onMouseLeaveRow(pack.id)}
          onclick={() => toggleRow(pack.id)}
        >
          {#if selectableRows.has(pack.id)}
            <input
              class="content-checkbox"
              name={pack.id}
              type="checkbox"
              {disabled}
              bind:checked={() => selectedRows.get(pack.id) ?? false, v => selectedRows.set(pack.id, v)}
              onchange={aggregateSummary}
              onclick={e => e.stopPropagation()}
            >
          {:else}
            <span class="content-checkbox"></span>
          {/if}
          <span class="content-label">
            {pack.title}
          </span>
          <span class="content-label">
            {pack.author}
          </span>
          <span class="content-label">
            {#if pack.url}
              <a
                title={pack.url}
                href={pack.url}
                target="_blank"
                rel="noopener noreferrer"
                onclick={e => e.stopPropagation()}
              >
                <i class="fas fa-external-link-alt"></i>
              </a>
            {/if}
          </span>
          <span class="curr-version">{pack.currentVersion}</span>
          <span class="content-icon">
            {#if pack.availableVersion}
              {#if pack.currentVersion === pack.availableVersion}
                <i class="fas fa-check"></i>
              {:else if selectedRows.has(pack.id)}
                <i class="fas fa-arrow-right"></i>
              {:else}
                <i class="fas fa-lock"></i>
              {/if}
            {/if}
          </span>
          <span class="avail-version">{pack.availableVersion}</span>
        </div>
      {/each}
    </div>
  </div>

  <div class="lcp-table__buttons">
    <button
      type="button"
      class="lancer-button lcp-bulk-import"
      title="Import/Update Selected"
      tabindex="-1"
      disabled={disabled || !lcpData.some(p => selectedRows.get(p.id))}
      onclick={dispatchLCPsToInstall}
    >
      <i class="cci cci-content-manager i--4"></i>
      Import/Update Selected
    </button>

    <button
      type="button"
      class="lancer-button lcp-clear-all"
      title="Clear Compendium Data"
      tabindex="-1"
      disabled={disabled || !lcpData.some(p => p.currentVersion !== "--")}
      onclick={onClearCompendiums}
    >
      <i class="fas fa-trash i--2"></i>
      Clear Compendium Data
    </button>
  </div>
</div>

<style lang="scss">
  @layer lancer {
    @layer applications {
      .lcp-table {
        max-height: 100%;
        height: 100%;
        & * {
          flex-grow: 0;
        }
      }
      button {
        margin: 10px;
        width: auto;
      }

      #lcp-table {
        display: grid;
        max-height: calc(100% - 8em);
        flex-grow: 1;
        overflow-y: scroll;
        .lcp-table__rows {
          height: fit-content;
        }

        .row {
          display: grid;
          position: relative;
          grid-template-columns: 2.5em 2fr 2fr 2.5em 1fr 3em 1fr;
          cursor: pointer;

          &:not(.header):nth-of-type(odd) {
            background-color: var(--darken-2);
          }
          &:not(.header):hover {
            background-color: var(--lighten-1);
          }
        }

        .header {
          font-weight: bold;
          border-bottom: 2px solid var(--secondary-color);
          align-content: center;
        }

        // .content-checkbox {
        // }

        .content-label {
          margin: 5px 10px;
        }

        .curr-version {
          margin: 5px 10px;
        }

        .avail-version {
          margin: 5px 10px;
        }

        .content-icon {
          margin: 5px 10px;
        }
      }
      .lcp-table__buttons {
        flex-grow: 0;
        .lcp-bulk-import,
        .lcp-clear-all {
          width: 100%;
          max-height: 3em;
          margin: 0.5em 0;
        }

        .lcp-clear-all {
          background-color: var(--background-color);
          border: 1px solid var(--lighten-5);
          &:hover {
            background-color: var(--color-level-error-bg) !important;
            border: 1px solid var(--color-level-error-border) !important;
          }
        }
      }
    }
  }
</style>
