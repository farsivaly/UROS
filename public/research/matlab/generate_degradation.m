%% generate_4run_degradation_60s.m
% ============================================================
% 4-RUN INTERNAL THERMAL DEGRADATION TEST - 60 SECONDS
%
% Fixed operating point:
%   Ambient temperature = 25 degC
%   Load power          = 2000 W
%   DC-link voltage     = 600 V
%   Modulation index    = 0.8
%
% Degradation levels:
%   Healthy   alpha_deg = 1.00
%   Mild      alpha_deg = 1.25
%   Moderate  alpha_deg = 1.50
%   Severe    alpha_deg = 2.00
%
% Logged outputs:
%   T_surface_inv
%   spatial_DTS
%
% Export:
%   Exactly 6002 samples from 0 to 60 s
%
% Model:
%   thermal_IGBT_Loss.slx
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
    "thermal_degradation_4run_60s");

if ~exist(outputDir, "dir")
    mkdir(outputDir);
end


%% ============================================================
% FIXED OPERATING CONDITIONS
% ============================================================

Ta_run = 25;                     % degC
Ta_K_run = Ta_run + 273.15;      % K

Pload_run = 2000;                % W

Vdc_run = 600;                   % V

m_run = 0.8;

f_sw_run = f_sw;


%% ============================================================
% 60-SECOND EXPORT
% ============================================================

t_stop = 60;

% Exact requested output size
n_export = 6002;

% Exactly 6002 points from 0 to 60 s
time_export = ...
    linspace(0, t_stop, n_export).';

fprintf("\n");
fprintf("Simulation duration = %.1f s\n", t_stop);
fprintf("CSV samples/run     = %d\n", n_export);
fprintf("First sample        = %.6f s\n", time_export(1));
fprintf("Final sample        = %.6f s\n", time_export(end));


%% ============================================================
% DEGRADATION LEVELS
% ============================================================

alpha_values = [
    1.00
    1.25
    1.50
    2.00
];

severity_names = [
    "Healthy"
    "Mild"
    "Moderate"
    "Severe"
];

nRuns = ...
    numel(alpha_values);


%% ============================================================
% INITIAL TEMPERATURE CONDITIONS
% ============================================================

Tinit_run = ...
    Ta_K_run * ones(1,3);

T_ambient_fibre_run = ...
    Ta_K_run;


%% ============================================================
% ELECTRICAL / LOSS PARAMETERS
% ============================================================

% PWM phase-voltage reference
Vref_peak_run = ...
    m_run * Vdc_run / 2;


% ------------------------------------------------------------
% Healthy semiconductor conduction parameters
% ------------------------------------------------------------

Vf_IGBT_run = 0.8;       % V
Ron_IGBT_run = 1e-3;     % ohm


% ------------------------------------------------------------
% Switching transition parameters
% ------------------------------------------------------------

if ~exist("tr_IGBT", "var")
    tr_IGBT = 11e-9;
end

if ~exist("tf_IGBT", "var")
    tf_IGBT = 63e-9;
end


% Psw_phase =
%
% Vdc * abs(Iphase) * Ksw

Ksw_run = ...
    f_sw_run * (tr_IGBT + tf_IGBT);


fprintf("Vref peak          = %.2f V\n", Vref_peak_run);
fprintf("Switching freq     = %.0f Hz\n", f_sw_run);
fprintf("Ksw                = %.3e\n\n", Ksw_run);


%% ============================================================
% MANIFEST
% ============================================================

manifest = table( ...
    'Size', [nRuns 14], ...
    'VariableTypes', { ...
        'double', ...
        'string', ...
        'string', ...
        'double', ...
        'double', ...
        'double', ...
        'double', ...
        'double', ...
        'double', ...
        'string', ...
        'double', ...
        'string', ...
        'string', ...
        'string'}, ...
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


%% ============================================================
% FOUR-RUN DEGRADATION SWEEP
% ============================================================

for iDeg = 1:nRuns

    %% --------------------------------------------------------
    % DEGRADATION CONDITION
    % ---------------------------------------------------------

    alpha_deg_run = ...
        alpha_values(iDeg);

    severity = ...
        severity_names(iDeg);


    fprintf("\n============================================\n");
    fprintf("Run %d / %d\n", iDeg, nRuns);
    fprintf("Severity      = %s\n", severity);
    fprintf("alpha_deg     = %.2f\n", alpha_deg_run);
    fprintf("Ambient       = %.1f C\n", Ta_run);
    fprintf("Load power    = %.0f W\n", Pload_run);
    fprintf("DC voltage    = %.0f V\n", Vdc_run);
    fprintf("============================================\n");


    %% ========================================================
    % INTERNAL THERMAL DEGRADATION
    % ========================================================

    Rth1_run = ...
        Rth1_h;

    Rth2_run = ...
        alpha_deg_run * Rth2_h;

    Rth3_run = ...
        Rth3_h;


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


    %% ========================================================
    % CREATE SIMULATION INPUT
    % ========================================================

    simIn = ...
        Simulink.SimulationInput(model);


    %% --------------------------------------------------------
    % Environment
    % ---------------------------------------------------------

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


    %% --------------------------------------------------------
    % Electrical operating point
    % ---------------------------------------------------------

    simIn = simIn.setVariable( ...
        "Vdc", ...
        Vdc_run);

    simIn = simIn.setVariable( ...
        "Pload", ...
        Pload_run);

    simIn = simIn.setVariable( ...
        "m", ...
        m_run);

    simIn = simIn.setVariable( ...
        "Vref_peak", ...
        Vref_peak_run);

    simIn = simIn.setVariable( ...
        "f_sw", ...
        f_sw_run);


    %% --------------------------------------------------------
    % Semiconductor conduction loss model
    % ---------------------------------------------------------

    simIn = simIn.setVariable( ...
        "Vf_IGBT", ...
        Vf_IGBT_run);

    simIn = simIn.setVariable( ...
        "Ron_IGBT", ...
        Ron_IGBT_run);


    %% --------------------------------------------------------
    % Semiconductor switching loss model
    % ---------------------------------------------------------

    simIn = simIn.setVariable( ...
        "tr_IGBT", ...
        tr_IGBT);

    simIn = simIn.setVariable( ...
        "tf_IGBT", ...
        tf_IGBT);

    simIn = simIn.setVariable( ...
        "Ksw", ...
        Ksw_run);


    %% --------------------------------------------------------
    % Internal thermal degradation
    % ---------------------------------------------------------

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


    %% --------------------------------------------------------
    % Keep thermal interface healthy
    % ---------------------------------------------------------

    simIn = simIn.setVariable( ...
        "alpha_interface", ...
        1.00);

    simIn = simIn.setVariable( ...
        "Rinterface", ...
        Rinterface_h);


    %% --------------------------------------------------------
    % Simulation duration
    % ---------------------------------------------------------

    simIn = simIn.setModelParameter( ...
        "StopTime", ...
        num2str(t_stop));


    %% ========================================================
    % OUTPUT FILE
    % ========================================================

    filename = sprintf( ...
        "thermal_%s_Ta%d_P%d_Vdc%d.csv", ...
        severity, ...
        Ta_run, ...
        Pload_run, ...
        Vdc_run);


    filePath = ...
        fullfile( ...
            outputDir, ...
            filename);


    %% ========================================================
    % RUN SIMULATION
    % ========================================================

    try

        simOut = ...
            sim(simIn);


        %% ====================================================
        % EXTRACT T_surface_inv
        % =====================================================

        Tsurface_ts = ...
            getLoggedSignal( ...
                simOut, ...
                "T_surface_inv");


        t_surface = ...
            Tsurface_ts.Time(:);


        T_surface_raw = ...
            squeeze( ...
                Tsurface_ts.Data);


        T_surface_raw = ...
            T_surface_raw(:);


        fprintf( ...
            "T_surface samples    = %d\n", ...
            numel(t_surface));


        %% ====================================================
        % EXTRACT spatial_DTS
        % =====================================================

        Tdts_ts = ...
            getLoggedSignal( ...
                simOut, ...
                "spatial_DTS");


        t_dts = ...
            Tdts_ts.Time(:);


        DTS_data = ...
            Tdts_ts.Data;


        fprintf( ...
            "Raw spatial_DTS size = %s\n", ...
            mat2str(size(DTS_data)));


        fprintf( ...
            "DTS time samples     = %d\n", ...
            numel(t_dts));


        %% ====================================================
        % FORMAT spatial_DTS
        % ========================================================
        %
        % Expected:
        %
        % [2 x 41 x N]
        %
        % Row 1 = DTS temperature data
        %
        % Desired:
        %
        % [N x 41]
        % =====================================================

        if ndims(DTS_data) == 3

            if size(DTS_data,3) ~= numel(t_dts)

                error( ...
                    "DTS time dimension mismatch. Raw size = %s, time samples = %d.", ...
                    mat2str(size(DTS_data)), ...
                    numel(t_dts));

            end


            T_DTS_raw = ...
                squeeze( ...
                    DTS_data(1,:,:)).';


        elseif ndims(DTS_data) == 2

            T_DTS_raw = ...
                DTS_data;


            if size(T_DTS_raw,2) == numel(t_dts)

                T_DTS_raw = ...
                    T_DTS_raw.';

            end


        else

            error( ...
                "Unsupported spatial_DTS dimensions: %s", ...
                mat2str(size(DTS_data)));

        end


        fprintf( ...
            "Extracted DTS size   = %s\n", ...
            mat2str(size(T_DTS_raw)));


        %% ====================================================
        % DIMENSION CHECKS
        % =====================================================

        if size(T_DTS_raw,1) ~= numel(t_dts)

            error( ...
                "DTS mismatch: %d data rows but %d time samples.", ...
                size(T_DTS_raw,1), ...
                numel(t_dts));

        end


        if numel(t_surface) < 2

            error( ...
                "T_surface_inv requires at least 2 samples.");

        end


        if numel(t_dts) < 2

            error( ...
                "spatial_DTS requires at least 2 samples.");

        end


        %% ====================================================
        % INTERPOLATE T_surface TO EXACTLY 6002 POINTS
        % =====================================================

        T_surface_export = ...
            interp1( ...
                t_surface, ...
                T_surface_raw, ...
                time_export, ...
                "linear", ...
                "extrap");


        %% ====================================================
        % INTERPOLATE DTS TO EXACTLY 6002 POINTS
        % =====================================================

        nDTS = ...
            size(T_DTS_raw,2);


        T_DTS_export = ...
            zeros( ...
                n_export, ...
                nDTS);


        for iCh = 1:nDTS

            T_DTS_export(:,iCh) = ...
                interp1( ...
                    t_dts, ...
                    T_DTS_raw(:,iCh), ...
                    time_export, ...
                    "linear", ...
                    "extrap");

        end


        %% ====================================================
        % CREATE OUTPUT TABLE
        % =====================================================

        runTable = table;


        runTable.time_s = ...
            time_export;


        runTable.T_surface_K = ...
            T_surface_export;


        runTable.T_surface_C = ...
            T_surface_export - 273.15;


        %% ----------------------------------------------------
        % DTS CHANNELS
        % -----------------------------------------------------

        for iCh = 1:nDTS

            channelNameK = ...
                sprintf( ...
                    "T_DTS_%02d_K", ...
                    iCh);


            channelNameC = ...
                sprintf( ...
                    "T_DTS_%02d_C", ...
                    iCh);


            runTable.(channelNameK) = ...
                T_DTS_export(:,iCh);


            runTable.(channelNameC) = ...
                T_DTS_export(:,iCh) - 273.15;

        end


        %% ====================================================
        % WRITE CSV
        % =====================================================

        writetable( ...
            runTable, ...
            filePath);


        %% ====================================================
        % MANIFEST SUCCESS
        % =====================================================

        manifest.run_id(iDeg) = ...
            iDeg;

        manifest.source_file(iDeg) = ...
            string(filename);

        manifest.severity(iDeg) = ...
            severity;

        manifest.alpha_deg(iDeg) = ...
            alpha_deg_run;

        manifest.ambient_temperature_C(iDeg) = ...
            Ta_run;

        manifest.ambient_temperature_K(iDeg) = ...
            Ta_K_run;

        manifest.Vdc_V(iDeg) = ...
            Vdc_run;

        manifest.Pload_W(iDeg) = ...
            Pload_run;

        manifest.modulation_index(iDeg) = ...
            m_run;

        manifest.degradation_type(iDeg) = ...
            "internal_thermal";

        manifest.simulation_duration_s(iDeg) = ...
            t_stop;

        manifest.status(iDeg) = ...
            "success";

        manifest.error_message(iDeg) = ...
            "";

        manifest.timestamp(iDeg) = ...
            string(datetime("now"));


        fprintf( ...
            "SUCCESS: %s\n", ...
            filename);


    catch ME

        %% ====================================================
        % FAILED RUN
        % =====================================================

        fprintf( ...
            "FAILED: %s\n", ...
            filename);


        fprintf( ...
            "Error: %s\n", ...
            ME.message);


        manifest.run_id(iDeg) = ...
            iDeg;

        manifest.source_file(iDeg) = ...
            string(filename);

        manifest.severity(iDeg) = ...
            severity;

        manifest.alpha_deg(iDeg) = ...
            alpha_deg_run;

        manifest.ambient_temperature_C(iDeg) = ...
            Ta_run;

        manifest.ambient_temperature_K(iDeg) = ...
            Ta_K_run;

        manifest.Vdc_V(iDeg) = ...
            Vdc_run;

        manifest.Pload_W(iDeg) = ...
            Pload_run;

        manifest.modulation_index(iDeg) = ...
            m_run;

        manifest.degradation_type(iDeg) = ...
            "internal_thermal";

        manifest.simulation_duration_s(iDeg) = ...
            t_stop;

        manifest.status(iDeg) = ...
            "failed";

        manifest.error_message(iDeg) = ...
            string(ME.message);

        manifest.timestamp(iDeg) = ...
            string(datetime("now"));

    end

end


%% ============================================================
% SAVE MANIFEST
% ============================================================

manifestPath = ...
    fullfile( ...
        outputDir, ...
        "simulation_manifest.csv");


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
fprintf("4-RUN 60-SECOND DEGRADATION TEST COMPLETE\n");
fprintf("============================================\n");

fprintf("Total runs:      %d\n", nRuns);
fprintf("Successful runs: %d\n", nSuccess);
fprintf("Failed runs:     %d\n", nFailed);
fprintf("CSV samples/run: %d\n", n_export);

fprintf( ...
    "\nOutput directory:\n%s\n", ...
    outputDir);

fprintf( ...
    "\nManifest:\n%s\n", ...
    manifestPath);


%% ============================================================
% LOCAL FUNCTION
% ============================================================

function ts = getLoggedSignal(simOut, signalName)

    %% --------------------------------------------------------
    % DIRECT SimulationOutput VARIABLE
    % ---------------------------------------------------------

    try

        candidate = ...
            simOut.get(signalName);


        if isa( ...
                candidate, ...
                "timeseries")

            ts = ...
                candidate;

            return;


        elseif isa( ...
                candidate, ...
                "Simulink.SimulationData.Signal")

            ts = ...
                candidate.Values;

            return;

        end

    catch
        % Continue.
    end


    %% --------------------------------------------------------
    % LOGSOUT
    % ---------------------------------------------------------

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
        % Continue.
    end


    %% --------------------------------------------------------
    % SIGNAL NOT FOUND
    % ---------------------------------------------------------

    error( ...
        "Signal '%s' was not found in SimulationOutput or logsout.", ...
        signalName);

end