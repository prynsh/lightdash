/**
 * Consider adding a short description of the feature flag and how it
 * will be used.
 *
 * If the feature flag is no longer in use, remove it from this enum.
 */
export enum FeatureFlags {
    /**/
    PassthroughLogin = 'passthrough-login',

    /**
     * Enables custom visualizations when the environment variable is also enabled
     */
    CustomVisualizationsEnabled = 'custom-visualizations-enabled',

    /**/
    ShowDbtCloudProjectOption = 'show-dbt-cloud-project-option',

    /**/
    CustomSQLEnabled = 'custom-sql-enabled',

    /* Show user groups */
    UserGroupsEnabled = 'user-groups-enabled',

    /** Enable dashboard tabs */
    DashboardTabs = 'dashboard_tabs',

    /* Send local timezone to the warehouse session */
    EnableUserTimezones = 'enable-user-timezones',

    /**
     * Enable the semantic layer
     */
    SemanticLayerEnabled = 'semantic-layer-enabled',

    /**
     * Enable dashboard comments
     */
    DashboardComments = 'dashboard-comments-enabled',

    /**
     * Enable scheduler task that replaces custom metrics after project compile
     */
    ReplaceCustomMetricsOnCompile = 'replace-custom-metrics-on-compile',

    /**
     * Enable the dynamic calculation of series color, when not manually set on the chart config.
     * This aims to make the colors more consistent, depending on the groups, but this could cause the opposite effect.
     * For more details, see https://github.com/lightdash/lightdash/issues/13831
     */
    CalculateSeriesColor = 'calculate-series-color',
}

export type FeatureFlag = {
    id: string;
    enabled: boolean;
};
