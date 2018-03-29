<template>
  <div class="container">
    <div class="row">
      <div class="col-md-8 col-md-offset-2">
        <table class="table table-condensed">
            <thead>
                <th>Repo Name</th>
                <th>Views (Total)</th>
                <th>Views (Unique)</th>
                <th>Clones (Total)</th>
                <th>Clones (Unique)</th>
            </thead>
            <tbody>
              <tr v-for="result in results" :key="result.repo.id">
                <td>{{ result.repo.name }}</td>
                <td>{{ result.views.summary.total }}</td>
                <td>{{ result.views.summary.unique }}</td>
                <td>{{ result.clones.summary.total }}</td>
                <td>{{ result.clones.summary.unique }}</td>
              </tr>
            </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { loadRepoTraffic } from "./loadRepoTraffic";
export default {
  name: "app",
  data() {
    return {
      results: []
    };
  },
  mounted() {
    loadRepoTraffic(this);
  }
};
</script>

<style>
.container {
  margin-top: 20px;
}
</style>
