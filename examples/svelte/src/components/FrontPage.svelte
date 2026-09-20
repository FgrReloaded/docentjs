<script lang="ts">
  import type { Story } from '../data'

  let { lead, second, third }: { lead: Story; second?: Story; third?: Story } = $props()
</script>

<section aria-labelledby="front-heading">
  <div class="section__head">
    <h2 id="front-heading">Front page</h2>
    <p class="kicker">Live preview</p>
  </div>

  <div class="front" data-docent="front">
    <p class="front__mast">Pressroom</p>

    <div class="front__lead">
      <h4>{lead.headline}</h4>
      <p>{lead.standfirst}</p>
      <p>By {lead.byline}</p>
    </div>

    <div class="front__cols">
      <div>
        <h5>{second?.headline ?? 'Slot open'}</h5>
        <div class="front__rules" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      </div>
      <div>
        <h5>{third?.headline ?? 'Slot open'}</h5>
        <div class="front__rules" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
      </div>
    </div>
  </div>
</section>
