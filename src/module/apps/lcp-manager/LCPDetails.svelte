<script lang="ts">
  import { fade } from "svelte/transition";
  import type { ContentSummary } from "../../util/lcps";
  import type { IContentPack } from "../../util/unpacking/packed-types";

  interface Props {
    contentSummary: ContentSummary | null;
    showImportButton: boolean;

    onImportMany: (p: IContentPack[] | null) => void;

    disabled: boolean;
  }

  let { contentSummary, showImportButton, onImportMany, disabled = false }: Props = $props();

  const FADE_MS = 100;

  let title = $derived(
    contentSummary
      ? `${contentSummary.name}${contentSummary.version ? ` v${contentSummary.version}` : ""}`
      : "No LCP Selected"
  );

  let imageExpanded = $state(false);

  function onHoverHandler() {
    imageExpanded = true;
  }

  function onUnhoverHandler() {
    imageExpanded = false;
  }
</script>

{#snippet lcpDescription(contentSummary: ContentSummary)}
  <div class="lcp-description minor clipped">
    <div class="">
      <span>Contents:</span>
      <ul>
        {#if contentSummary.skills}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.skills}</span> pilot skills
          </li>
        {/if}
        {#if contentSummary.talents}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.talents}</span> talents
          </li>
        {/if}
        {#if contentSummary.bonds}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.bonds}</span> bonds
          </li>
        {/if}
        {#if contentSummary.reserves}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.reserves}</span> reserves
          </li>
        {/if}
        {#if contentSummary.gear}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.gear}</span>
            pilot gear
          </li>
        {/if}
        {#if contentSummary.frames}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.frames}</span> frames
          </li>
        {/if}
        {#if contentSummary.systems}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.systems}</span> mech systems
          </li>
        {/if}
        {#if contentSummary.weapons}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.weapons}</span> mech weapons
          </li>
        {/if}
        {#if contentSummary.mods}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.mods}</span>
            weapon mods
          </li>
        {/if}
        {#if contentSummary.npc_classes}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.npc_classes}</span> NPC classes
          </li>
        {/if}
        {#if contentSummary.npc_templates}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.npc_templates}</span> NPC templates
          </li>
        {/if}
        {#if contentSummary.npc_features}
          <li>
            <span class="lcp-manifest-badge">{contentSummary.npc_features}</span> NPC features
          </li>
        {/if}
      </ul>
      {#if contentSummary.description}
        {@html contentSummary.description}
      {/if}
    </div>
  </div>
{/snippet}

{#snippet lcpImage(contentSummary: ContentSummary)}
  <div
    role="none"
    class="lcp-image clipped"
    onmouseenter={onHoverHandler}
    onmouseleave={onUnhoverHandler}
  >
    <img
      class="manifest-image"
      src={contentSummary.image_url}
      title={contentSummary.name}
      alt={contentSummary.name}
    >
  </div>
  <div
    class="lcp-image__expanded"
    style:background-image={`url("${contentSummary.image_url}")`}
  >
  </div>
{/snippet}

<!-- Show LCP name, art, and contents -->
<div class="lcp-details">
  {#key contentSummary}
    <div
      in:fade={{ duration: 333, delay: FADE_MS }}
      out:fade={{ duration: FADE_MS }}
      class="lcp-details__fade"
    >
      <div class="lancer-header lancer-primary major clipped-top">
        <span>{title}</span>
      </div>
      {#if contentSummary}
        {#if contentSummary.website}
          <a
            href={contentSummary.website}
            class="medium card clipped"
          >
            by {contentSummary.author}
          </a>
        {:else}
          <div class="medium card clipped">
            by {contentSummary.author}
          </div>
        {/if}
        <div class="lcp-details__content {imageExpanded ? 'image-expanded' : ''}">
          {@render lcpDescription(contentSummary)}
          {#if contentSummary.image_url}
            {@render lcpImage(contentSummary)}
          {/if}
        </div>
        {#if !showImportButton && !contentSummary.aggregate}
          <button
            transition:fade|global
            type="button"
            class="lcp-import"
            title="Import LCP"
            tabindex="-1"
            {disabled}
            onclick={() => onImportMany(null)}
          >
            <i class="cci cci-content-manager i--4"></i>
            Import LCP
          </button>
        {/if}
      {/if}
    </div>
  {/key}
</div>

<style lang="scss">
  @layer lancer {
    @layer components {
      button {
        border-radius: 2px;
      }

      .lcp-details {
        display: grid;
        height: 100%;
        overflow: hidden;
        min-height: 23rem;
      }

      .lcp-details__fade {
        display: flex;
        flex-direction: column;
        grid-area: 1/1;

        min-height: 0;
      }

      .lcp-details__content {
        display: flex;
        flex-direction: row;
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: auto;

        min-height: 0;
        position: relative;

        &.image-expanded {
          .lcp-description {
            opacity: 0;
            pointer-events: none;
          }

          .lcp-image {
            opacity: 0;
          }

          .lcp-image__expanded {
            opacity: 1;
          }
        }
      }

      .lcp-description {
        flex-grow: 1;
        flex-shrink: 1;
        flex-basis: auto;

        min-height: 0;
        min-width: 0;
        overflow-y: auto;

        background-color: var(--darken-1);
        margin-right: 5px;
        padding: 10px;

        transition: opacity 250ms ease;
      }

      .lcp-image {
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: auto;

        min-width: 150px;
        max-width: 150px;

        display: flex;
        justify-content: center;
        align-items: stretch;
        min-height: 0;
        overflow: hidden;

        transition: opacity 250ms ease;
      }

      .lcp-image__expanded {
        position: absolute;
        inset: 0;

        background-size: contain;
        background-position: right center;
        background-repeat: no-repeat;

        opacity: 0;
        pointer-events: none;
        transition: opacity 250ms ease;
      }

      .manifest-image {
        flex-grow: 0;
        flex-shrink: 0;
        flex-basis: auto;

        height: 100%;
        width: auto;
        max-width: none;
        margin: 0;
      }
    }
  }
</style>
