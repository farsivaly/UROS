%% generate_thermal_degradation_screening.m
% ============================================================
% 20-RUN SCREENING DATASET
%
% INTERNAL THERMAL DEGRADATION ONLY
%
% Operating variables:
%   - Ambient temperature
%   - AC real load power
%   - DC-link voltage
%   - Internal thermal degradation
%
% Electrical architecture:
%   Ideal three-phase switching inverter
%           ->
%   External semiconductor loss model
%           ->
%   Controlled Heat Flow Rate Source
%           ->
%   Cauer thermal network
%           ->
%   Raman DTS
%
% Purpose:
% Verify that electrical operating-condition changes propagate
% through semiconductor losses into T_surface and Raman DTS
% BEFORE launching the full dataset.
%
% Model:
% thermal_IGBT_Loss.slx
% ============================================================

clear;
clc;


%% ============================================================
% INITIALISATION
% ============================================================

run("init_pv_inverter.m");

model = "thermal_IGBT_Loss";

load_system(model);


%% ============================================================
% OUTPUT FOLDER
% ============================================================

outputDir = fullfile( ...
    pwd, ...
    "data", ...
    "raw", ...
    "thermal_degradation_screening");

if ~exist(outputDir, "dir")
    mkdir(outputDir);
end


%% ============================================================
% SCREENING PARAMETERS
% ============================================================

% ------------------------------------------------------------
% Ambient temperature [degC]
% ------------------------------------------------------------

ambient_values = [15 20 25 30 35];


% ------------------------------------------------------------
% Three-phase real load power [W]
% ------------------------------------------------------------

Pload_values = [2000 4000];


% ------------------------------------------------------------
% DC-link operating voltage [V]
% ------------------------------------------------------------
%
% Keep fixed initially.
% Once electrical/thermal coupling is validated,
% additional Vdc points can be added.

Vdc_values = [600];


% ------------------------------------------------------------
% Internal thermal degradation
% ------------------------------------------------------------
%
% Healthy + Severe only during screening.

alpha_values = [1.00 2.00];

severity_names = [
    "Healthy"
    "Severe"
];


%% ============================================================
% FIXED OPERATING PARAMETERS
% ============================================================

% Modulation index
m_fixed = 0.8;

% Switching frequency [Hz]
f_sw_fixed = f_sw;

% Simulation duration [s]
t_stop = 60;

% Desired exported sampling interval [s]
sample_time = 0.01;

% Common exported time vector
time_export = (0:sample_time:t_stop).';


%% ============================================================
% SEMICONDUCTOR LOSS PARAMETERS
% ============================================================
%
% Conduction:
%
%   Pcond = Vf*|I| + Ron*I^2
%
% Switching:
%
%   Psw_phase =
%       Vdc * |Iphase| * f_sw * (tr + tf)
%
% Semiconductor remains HEALTHY during this screening because
% the degradation mechanism being varied is Rth2 only.

Vf_IGBT_screen = 0.8;       % [V]
Ron_IGBT_screen = 1e-3;     % [ohm]

% Ensure switching transition parameters exist.
%
% These can already be defined in init_pv_inverter.m.

if ~exist("tr_IGBT", "var")
    tr_IGBT = 11e-9;
end

if ~exist("tf_IGBT", "var")
    tf_IGBT = 63e-9;
end


%% ============================================================
% TOTAL RUNS
% ============================================================

nRuns = ...
    numel(ambient_values) * ...
    numel(Pload_values) * ...
    numel(Vdc_values) * ...
    numel(alpha_values);


fprintf("\n============================================\n");
fprintf("THERMAL OPERATING-CONDITION SCREENING\n");
fprintf("============================================\n");

fprintf( ...
    "Total simulations: %d\n", ...
    nRuns);

fprintf( ...
    "Expected samples per run: %d\n", ...
    numel(time_export));

fprintf( ...
    "Switching frequency: %.0f Hz\n", ...
    f_sw_fixed);

fprintf( ...
    "Modulation index: %.2f\n\n", ...
    m_fixed);


%% ============================================================
% MANIFEST
% ============================================================

manifest = table( ...
    'Size', [nRuns 14], ...
    'VariableTypes', { ...
        'double', ... % run_id
        'string', ... % source_file
        'string', ... % severity
        'double', ... % alpha_deg
        'double', ... % ambient C
        'double', ... % ambient K
        'double', ... % Vdc
        'double', ... % Pload
        'double', ... % m
        'string', ... % degradation type
        'double', ... % duration
        'string', ... % status
        'string', ... % error
        'string'}, ... % timestamp
    'VariableNames', { ...
        'run_id', ...
        'source_file', ...
        'severity', ...
        'alpha_deg', ...
        'ambient_temperature_C', ...
        'ambient_temperature_K', ...
        'Vdc_V', ...
        'Pload_W', ...
        'modulation_index', ...
        'degradation_type', ...
        'simulation_duration_s', ...
        'status', ...
        'error_message', ...
        'timestamp'});


runCounter = 0;


%% ============================================================
% PARAMETER SWEEP
% ============================================================

for iTa = 1:numel(ambient_values)

    %% --------------------------------------------------------
    % AMBIENT TEMPERATURE
    % ---------------------------------------------------------

    Ta_run = ambient_values(iTa);

    Ta_K_run = Ta_run + 273.15;

    Tinit_run = Ta_K_run * ones(1,3);

    T_ambient_fibre_run = Ta_K_run;


    for iP = 1:numel(Pload_values)

        %% ----------------------------------------------------
        % LOAD POWER
        % -----------------------------------------------------

        Pload_run = Pload_values(iP);


        for iV = 1:numel(Vdc_values)

            %% ------------------------------------------------
            % DC OPERATING POINT
            % -------------------------------------------------

            Vdc_run = Vdc_values(iV);


            % PWM reference amplitude
            Vref_peak_run = ...
                m_fixed * Vdc_run / 2;


            % -------------------------------------------------
            % SWITCHING LOSS COEFFICIENT
            % -------------------------------------------------
            %
            % Psw_phase =
            %
            %   Vdc * abs(Iphase) * Ksw
            %
            % where
            %
            %   Ksw = f_sw * (tr + tf)

            t_sw_IGBT_run = ...
                tr_IGBT + tf_IGBT;

            Ksw_run = ...
                f_sw_fixed * t_sw_IGBT_run;


            for iDeg = 1:numel(alpha_values)

                runCounter = runCounter + 1;


                %% --------------------------------------------
                % DEGRADATION
                % ---------------------------------------------

                alpha_deg_run = ...
                    alpha_values(iDeg);

                severity = ...
                    severity_names(iDeg);


                fprintf("\n============================================\n");

                fprintf( ...
                    "Run %d / %d\n", ...
                    runCounter, ...
                    nRuns);

                fprintf( ...
                    "Ambient       = %.1f C\n", ...
                    Ta_run);

                fprintf( ...
                    "DC voltage    = %.0f V\n", ...
                    Vdc_run);

                fprintf( ...
                    "Load power    = %.0f W\n", ...
                    Pload_run);

                fprintf( ...
                    "Severity      = %s\n", ...
                    severity);

                fprintf( ...
                    "alpha_deg     = %.2f\n", ...
                    alpha_deg_run);

                fprintf( ...
                    "Vref peak     = %.1f V\n", ...
                    Vref_peak_run);

                fprintf( ...
                    "Ksw           = %.3e\n", ...
                    Ksw_run);


                %% ============================================
                % INTERNAL THERMAL DEGRADATION
                % =============================================

                Rth1_run = Rth1_h;

                Rth2_run = ...
                    alpha_deg_run * Rth2_h;

                Rth3_run = Rth3_h;


                Rth_run = [ ...
                    Rth1_run ...
                    Rth2_run ...
                    Rth3_run];


                Cth_run = [ ...
                    Cth1 ...
                    Cth2 ...
                    Cth3];


                tau_th_run = ...
                    Rth_run .* Cth_run;


                %% ============================================
                % CREATE SIMULATION INPUT
                % =============================================

                simIn = ...
                    Simulink.SimulationInput(model);


                %% ============================================
                % ENVIRONMENT
                % =============================================

                simIn = simIn.setVariable( ...
                    "Ta", ...
                    Ta_run);

                simIn = simIn.setVariable( ...
                    "Ta_K", ...
                    Ta_K_run);

                simIn = simIn.setVariable( ...
                    "Tinit", ...
                    Tinit_run);

                simIn = simIn.setVariable( ...
                    "T_ambient_fibre", ...
                    T_ambient_fibre_run);


                %% ============================================
                % ELECTRICAL OPERATING CONDITIONS
                % =============================================

                simIn = simIn.setVariable( ...
                    "Vdc", ...
                    Vdc_run);

                simIn = simIn.setVariable( ...
                    "Pload", ...
                    Pload_run);

                simIn = simIn.setVariable( ...
                    "m", ...
                    m_fixed);

                simIn = simIn.setVariable( ...
                    "Vref_peak", ...
                    Vref_peak_run);

                simIn = simIn.setVariable( ...
                    "f_sw", ...
                    f_sw_fixed);


                %% ============================================
                % SEMICONDUCTOR CONDUCTION LOSS MODEL
                % =============================================
                %
                % Healthy semiconductor parameters:
                %
                % Pcond_device =
                %
                %   g * (Vf*abs(I) + Ron*I^2)

                simIn = simIn.setVariable( ...
                    "Vf_IGBT", ...
                    Vf_IGBT_screen);

                simIn = simIn.setVariable( ...
                    "Ron_IGBT", ...
                    Ron_IGBT_screen);


                %% ============================================
                % SEMICONDUCTOR SWITCHING LOSS MODEL
                % =============================================
                %
                % Psw_phase =
                %
                % Vdc * abs(Iphase) *
                % f_sw * (tr + tf)

                simIn = simIn.setVariable( ...
                    "tr_IGBT", ...
                    tr_IGBT);

                simIn = simIn.setVariable( ...
                    "tf_IGBT", ...
                    tf_IGBT);

                simIn = simIn.setVariable( ...
                    "Ksw", ...
                    Ksw_run);


                %% ============================================
                % THERMAL NETWORK
                % =============================================

                simIn = simIn.setVariable( ...
                    "alpha_deg", ...
                    alpha_deg_run);

                simIn = simIn.setVariable( ...
                    "Rth1", ...
                    Rth1_run);

                simIn = simIn.setVariable( ...
                    "Rth2", ...
                    Rth2_run);

                simIn = simIn.setVariable( ...
                    "Rth3", ...
                    Rth3_run);

                simIn = simIn.setVariable( ...
                    "Rth", ...
                    Rth_run);

                simIn = simIn.setVariable( ...
                    "Cth", ...
                    Cth_run);

                simIn = simIn.setVariable( ...
                    "tau_th", ...
                    tau_th_run);


                %% ============================================
                % SIMULATION TIME
                % =============================================

                simIn = simIn.setModelParameter( ...
                    "StopTime", ...
                    num2str(t_stop));


                %% ============================================
                % OUTPUT FILE NAME
                % =============================================

                severityTag = ...
                    lower(char(severity));

                filename = sprintf( ...
                    "run_%03d_Ta_%02.0fC_P_%04.0fW_Vdc_%03.0fV_%s.csv", ...
                    runCounter, ...
                    Ta_run, ...
                    Pload_run, ...
                    Vdc_run, ...
                    severityTag);

                filePath = ...
                    fullfile(outputDir, filename);


                %% ============================================
                % RUN SIMULATION
                % =============================================

                try

                    simOut = sim(simIn);


                    %% ========================================
                    % EXTRACT T_surface
                    % =========================================

                    Tsurface_ts = ...
                        getLoggedSignal( ...
                            simOut, ...
                            "T_surface");


                    t_surface = ...
                        Tsurface_ts.Time(:);

                    T_surface_raw = ...
                        squeeze(Tsurface_ts.Data);

                    T_surface_raw = ...
                        T_surface_raw(:);


                    %% ========================================
                    % EXTRACT RAMAN DTS
                    % =========================================

                    Tdts_ts = ...
                        getLoggedSignal( ...
                            simOut, ...
                            "T_DTS");


                    t_dts = ...
                        Tdts_ts.Time(:);

                    T_DTS_raw = ...
                        squeeze(Tdts_ts.Data);


                    % Make sure time is along rows.
                    if size(T_DTS_raw,1) ~= numel(t_dts) && ...
                            size(T_DTS_raw,2) == numel(t_dts)

                        T_DTS_raw = ...
                            T_DTS_raw.';

                    end


                    %% ========================================
                    % INTERPOLATE TO COMMON EXPORT TIME
                    % =========================================

                    T_surface_export = interp1( ...
                        t_surface, ...
                        T_surface_raw, ...
                        time_export, ...
                        "linear", ...
                        "extrap");


                    nDTS = ...
                        size(T_DTS_raw,2);


                    T_DTS_export = ...
                        zeros(numel(time_export), nDTS);


                    for iCh = 1:nDTS

                        T_DTS_export(:,iCh) = interp1( ...
                            t_dts, ...
                            T_DTS_raw(:,iCh), ...
                            time_export, ...
                            "linear", ...
                            "extrap");

                    end


                    %% ========================================
                    % CREATE OUTPUT TABLE
                    % =========================================

                    runTable = table;

                    runTable.time_s = ...
                        time_export;

                    runTable.T_surface_K = ...
                        T_surface_export;

                    runTable.T_surface_C = ...
                        T_surface_export - 273.15;


                    % ----------------------------------------
                    % DTS channels
                    % -----------------------------------------

                    for iCh = 1:nDTS

                        channelNameK = ...
                            sprintf("T_DTS_%02d_K", iCh);

                        channelNameC = ...
                            sprintf("T_DTS_%02d_C", iCh);

                        runTable.(channelNameK) = ...
                            T_DTS_export(:,iCh);

                        runTable.(channelNameC) = ...
                            T_DTS_export(:,iCh) - 273.15;

                    end


                    %% ========================================
                    % WRITE CSV
                    % =========================================

                    writetable( ...
                        runTable, ...
                        filePath);


                    %% ========================================
                    % UPDATE MANIFEST
                    % =========================================

                    manifest.run_id(runCounter) = ...
                        runCounter;

                    manifest.source_file(runCounter) = ...
                        string(filename);

                    manifest.severity(runCounter) = ...
                        severity;

                    manifest.alpha_deg(runCounter) = ...
                        alpha_deg_run;

                    manifest.ambient_temperature_C(runCounter) = ...
                        Ta_run;

                    manifest.ambient_temperature_K(runCounter) = ...
                        Ta_K_run;

                    manifest.Vdc_V(runCounter) = ...
                        Vdc_run;

                    manifest.Pload_W(runCounter) = ...
                        Pload_run;

                    manifest.modulation_index(runCounter) = ...
                        m_fixed;

                    manifest.degradation_type(runCounter) = ...
                        "internal_thermal";

                    manifest.simulation_duration_s(runCounter) = ...
                        t_stop;

                    manifest.status(runCounter) = ...
                        "success";

                    manifest.error_message(runCounter) = ...
                        "";

                    manifest.timestamp(runCounter) = ...
                        string(datetime("now"));


                    fprintf( ...
                        "SUCCESS: %s\n", ...
                        filename);


                catch ME

                    %% ========================================
                    % FAILED RUN
                    % =========================================

                    warning( ...
                        "Run %d failed: %s", ...
                        runCounter, ...
                        ME.message);


                    manifest.run_id(runCounter) = ...
                        runCounter;

                    manifest.source_file(runCounter) = ...
                        string(filename);

                    manifest.severity(runCounter) = ...
                        severity;

                    manifest.alpha_deg(runCounter) = ...
                        alpha_deg_run;

                    manifest.ambient_temperature_C(runCounter) = ...
                        Ta_run;

                    manifest.ambient_temperature_K(runCounter) = ...
                        Ta_K_run;

                    manifest.Vdc_V(runCounter) = ...
                        Vdc_run;

                    manifest.Pload_W(runCounter) = ...
                        Pload_run;

                    manifest.modulation_index(runCounter) = ...
                        m_fixed;

                    manifest.degradation_type(runCounter) = ...
                        "internal_thermal";

                    manifest.simulation_duration_s(runCounter) = ...
                        t_stop;

                    manifest.status(runCounter) = ...
                        "failed";

                    manifest.error_message(runCounter) = ...
                        string(ME.message);

                    manifest.timestamp(runCounter) = ...
                        string(datetime("now"));

                end

            end     % iDeg

        end         % iV

    end             % iP

end                 % iTa


%% ============================================================
% SAVE MANIFEST
% ============================================================

manifestPath = ...
    fullfile(outputDir, "screening_manifest.csv");

writetable( ...
    manifest, ...
    manifestPath);


%% ============================================================
% SUMMARY
% ============================================================

nSuccess = ...
    sum(manifest.status == "success");

nFailed = ...
    sum(manifest.status == "failed");


fprintf("\n============================================\n");
fprintf("SCREENING COMPLETE\n");
fprintf("============================================\n");

fprintf( ...
    "Successful runs: %d / %d\n", ...
    nSuccess, ...
    nRuns);

fprintf( ...
    "Failed runs:     %d / %d\n", ...
    nFailed, ...
    nRuns);

fprintf( ...
    "Output folder:\n%s\n", ...
    outputDir);

fprintf( ...
    "Manifest:\n%s\n\n", ...
    manifestPath);


%% ============================================================
% LOCAL FUNCTION
% ============================================================
%
% Looks first for a SimulationOutput variable with the requested
% name, then checks logsout.

function ts = getLoggedSignal(simOut, signalName)

    % --------------------------------------------------------
    % Direct SimulationOutput variable
    % --------------------------------------------------------

    try

        candidate = ...
            simOut.get(signalName);

        if isa(candidate, "timeseries")

            ts = candidate;
            return;

        elseif isa(candidate, "Simulink.SimulationData.Signal")

            ts = candidate.Values;
            return;

        end

    catch
        % Continue to logsout search.
    end


    % --------------------------------------------------------
    % logsout
    % --------------------------------------------------------

    try

        logsout = ...
            simOut.logsout;

        element = ...
            logsout.get(signalName);

        if ~isempty(element)

            ts = ...
                element.Values;

            return;

        end

    catch
        % Continue to final error.
    end


    % --------------------------------------------------------
    % Signal not found
    % --------------------------------------------------------

    error( ...
        "Signal '%s' was not found in SimulationOutput or logsout.", ...
        signalName);

end