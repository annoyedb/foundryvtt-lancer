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
</script>

<!-- Show LCP name, art, and contents -->
<div class="lcp-details">
  {#key contentSummary}
    <div in:fade={{ duration: 333, delay: FADE_MS }} out:fade={{ duration: FADE_MS }} class="lcp-details__fade">
      <div class="lancer-header lancer-primary major">
        <span>{title}</span>
      </div>
      {#if contentSummary}
        <div class="lcp-details__content">
          {#if contentSummary.website}
            <a
              href={contentSummary.website}
              class={`medium card clipped`}
              style="padding: 5px"
            >
              by {contentSummary.author}
            </a>
          {:else}
            <div
              class={`medium card clipped`}
              style="padding: 5px"
            >
              by {contentSummary.author}
            </div>
          {/if}
          <div class="lcp-description minor desc-text">
            <div class={``}>
              {#if contentSummary.image_url}
                <img
                  class={`manifest-image`}
                  src={contentSummary.image_url}
                  title={contentSummary.name}
                  alt={contentSummary.name}
                >
              {/if}
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
        </div>
      {/if}
    </div>
  {/key}
</div>

<style lang="scss">
  @layer lancer {
    @layer components {
      .lcp-details {
        display: grid;
      }

      .lcp-details__fade {
        grid-area: 1/1;
      }

      .lcp-details.card {
        margin-left: 0;
        margin-right: 0;
        margin-bottom: 0;
        max-height: calc(100% - 5.5em);
      }

      .lcp-details__content {
        width: 100%;
        display: inline-grid;
        grid-template-rows: auto 1fr auto;
        max-height: calc(100% - 3em);
        overflow-y: hidden;

        .lcp-description {
          overflow-y: scroll;

          & ul {
            margin-top: 0.25em;
          }
        }
      }

      .manifest-image {
        max-width: 400px;
        max-height: 400px;

        .lcp-description & {
          float: right;
          margin-left: 10px;
          margin-bottom: 10px;
          max-width: 60%;
        }
      }
    }
  }
</style>
