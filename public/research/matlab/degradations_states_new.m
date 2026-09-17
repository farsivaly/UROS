%% generate_100run_thermal_degradation_continue49.m
% ============================================================
% CONTINUE 100-RUN INTERNAL THERMAL DEGRADATION DATASET
%
% Continues from:
%   Run 49 -> Run 100
%
% Varied:
%   Ambient temperature = 15,20,25,30,35 C
%   DC-link voltage      = 500,550,600,650,700 V
%   Degradation          = Healthy,Mild,Moderate,Severe
%
% Fixed:
%   Pload = 2000 W
%   m     = 0.8
%
% Outputs:
%   T_surface_inv
%   spatial_DTS
%
% Export:
%   Exactly 6002 samples from 0 to 60 s
%
% Existing runs 1-48 are NOT rerun.
% Existing manifest is preserved if found.
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
    "thermal_degradation_100run");

if ~exist(outputDir, "dir")
    mkdir(outputDir);
end


%% ============================================================
% SWEEP PARAMETERS
% ============================================================

ambient_values = [ ...
    15 ...
    20 ...
    25 ...
    30 ...
    35 ...
];

Vdc_values = [ ...
    500 ...
    550 ...
    600 ...
    650 ...
    700 ...
];

alpha_values = [ ...
    1.00 ...
    1.25 ...
    1.50 ...
    2.00 ...
];

severity_names = [
    "Healthy"
    "Mild"
    "Moderate"
    "Severe"
];


%% ============================================================
% FIXED OPERATING CONDITIONS
% ============================================================

Pload_fixed = 2000;     % W

m_fixed = 0.8;

f_sw_fixed = f_sw;


%% ============================================================
% SIMULATION / EXPORT SETTINGS
% ============================================================

t_stop = 60;

n_export = 6002;

time_export = ...
    linspace( ...
        0, ...
        t_stop, ...
        n_export).';


%% ============================================================
% SEMICONDUCTOR LOSS PARAMETERS
% ============================================================

Vf_IGBT_fixed = 0.8;

Ron_IGBT_fixed = 1e-3;


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
    numel(Vdc_values) * ...
    numel(alpha_values);


first_run = 49;

last_run = 100;


fprintf("\n");
fprintf("============================================\n");
fprintf("CONTINUING 100-RUN THERMAL DATASET\n");
fprintf("============================================\n");
fprintf("Total campaign runs: %d\n", nRuns);
fprintf("Starting from run:   %d\n", first_run);
fprintf("Finishing at run:    %d\n", last_run);
fprintf("Runs remaining:      %d\n", ...
    last_run - first_run + 1);
fprintf("Duration/run:        %.1f s\n", t_stop);
fprintf("CSV samples/run:     %d\n", n_export);
fprintf("Fixed load:          %.0f W\n", Pload_fixed);
fprintf("Modulation index:    %.2f\n", m_fixed);
fprintf("============================================\n\n");


%% ============================================================
% MANIFEST PATH
% ============================================================

manifestPath = ...
    fullfile( ...
        outputDir, ...
        "simulation_manifest.csv");


%% ============================================================
% CREATE EMPTY MANIFEST
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
% LOAD EXISTING MANIFEST
% ============================================================

if exist(manifestPath, "file")

    fprintf("Existing manifest found.\n");
    fprintf("Loading previous run information...\n\n");

    oldManifest = ...
        readtable( ...
            manifestPath, ...
            "TextType", ...
            "string");


    nOld = ...
        min( ...
            height(oldManifest), ...
            nRuns);


    if nOld > 0

        commonVariables = ...
            intersect( ...
                manifest.Properties.VariableNames, ...
                oldManifest.Properties.VariableNames, ...
                "stable");


        for iVar = 1:numel(commonVariables)

            variableName = ...
                commonVariables{iVar};


            try

                manifest.(variableName)(1:nOld) = ...
                    oldManifest.(variableName)(1:nOld);

            catch

                fprintf( ...
                    "Warning: could not restore manifest variable %s\n", ...
                    variableName);

            end

        end

    end


    fprintf( ...
        "Loaded existing manifest with %d rows.\n\n", ...
        nOld);

else

    fprintf("No existing manifest found.\n");
    fprintf("A new manifest will be created.\n\n");

end


%% ============================================================
% RUN COUNTER
% ============================================================

runCounter = 0;


%% ============================================================
% PARAMETER SWEEP
% ============================================================

for iTa = 1:numel(ambient_values)


    %% --------------------------------------------------------
    % AMBIENT TEMPERATURE
    % ---------------------------------------------------------

    Ta_run = ...
        ambient_values(iTa);


    Ta_K_run = ...
        Ta_run + 273.15;


    Tinit_run = ...
        Ta_K_run * ones(1,3);


    T_ambient_fibre_run = ...
        Ta_K_run;


    %% --------------------------------------------------------
    % DC VOLTAGE SWEEP
    % ---------------------------------------------------------

    for iV = 1:numel(Vdc_values)


        Vdc_run = ...
            Vdc_values(iV);


        %% ----------------------------------------------------
        % PWM REFERENCE
        % -----------------------------------------------------

        Vref_peak_run = ...
            m_fixed * Vdc_run / 2;


        %% ----------------------------------------------------
        % SWITCHING LOSS COEFFICIENT
        % -----------------------------------------------------

        Ksw_run = ...
            f_sw_fixed * ...
            (tr_IGBT + tf_IGBT);


        %% ----------------------------------------------------
        % DEGRADATION SWEEP
        % -----------------------------------------------------

        for iDeg = 1:numel(alpha_values)


            runCounter = ...
                runCounter + 1;


            %% =================================================
            % SKIP ALREADY-COMPLETED RUNS 1-48
            % =================================================

            if runCounter < first_run

                continue;

            end


            %% =================================================
            % STOP AFTER RUN 100
            % =================================================

            if runCounter > last_run

                break;

            end


            %% =================================================
            % DEGRADATION CONDITION
            % =================================================

            alpha_deg_run = ...
                alpha_values(iDeg);


            severity = ...
                severity_names(iDeg);


            fprintf("\n");
            fprintf("============================================\n");
            fprintf("Run %d / %d\n", runCounter, nRuns);
            fprintf("Ambient       = %.1f C\n", Ta_run);
            fprintf("DC voltage    = %.0f V\n", Vdc_run);
            fprintf("Load power    = %.0f W\n", Pload_fixed);
            fprintf("Severity      = %s\n", severity);
            fprintf("alpha_deg     = %.2f\n", alpha_deg_run);
            fprintf("============================================\n");


            %% =================================================
            % INTERNAL THERMAL DEGRADATION
            % =================================================

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


            %% =================================================
            % SIMULATION INPUT
            % =================================================

            simIn = ...
                Simulink.SimulationInput(model);


            %% -------------------------------------------------
            % ENVIRONMENT
            % --------------------------------------------------

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


            %% -------------------------------------------------
            % ELECTRICAL CONDITIONS
            % --------------------------------------------------

            simIn = simIn.setVariable( ...
                "Vdc", ...
                Vdc_run);


            simIn = simIn.setVariable( ...
                "Pload", ...
                Pload_fixed);


            simIn = simIn.setVariable( ...
                "m", ...
                m_fixed);


            simIn = simIn.setVariable( ...
                "Vref_peak", ...
                Vref_peak_run);


            simIn = simIn.setVariable( ...
                "f_sw", ...
                f_sw_fixed);


            %% -------------------------------------------------
            % CONDUCTION LOSS MODEL
            % --------------------------------------------------

            simIn = simIn.setVariable( ...
                "Vf_IGBT", ...
                Vf_IGBT_fixed);


            simIn = simIn.setVariable( ...
                "Ron_IGBT", ...
                Ron_IGBT_fixed);


            %% -------------------------------------------------
            % SWITCHING LOSS MODEL
            % --------------------------------------------------

            simIn = simIn.setVariable( ...
                "tr_IGBT", ...
                tr_IGBT);


            simIn = simIn.setVariable( ...
                "tf_IGBT", ...
                tf_IGBT);


            simIn = simIn.setVariable( ...
                "Ksw", ...
                Ksw_run);


            %% -------------------------------------------------
            % THERMAL NETWORK
            % --------------------------------------------------

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


            %% -------------------------------------------------
            % KEEP INTERFACE HEALTHY
            % --------------------------------------------------

            simIn = simIn.setVariable( ...
                "alpha_interface", ...
                1.00);


            simIn = simIn.setVariable( ...
                "Rinterface", ...
                Rinterface_h);


            %% -------------------------------------------------
            % STOP TIME
            % --------------------------------------------------

            simIn = simIn.setModelParameter( ...
                "StopTime", ...
                num2str(t_stop));


            %% =================================================
            % OUTPUT FILE
            % =================================================

            filename = sprintf( ...
                "run_%03d_%s_Ta%d_Vdc%d_P%d.csv", ...
                runCounter, ...
                severity, ...
                Ta_run, ...
                Vdc_run, ...
                Pload_fixed);


            filePath = ...
                fullfile( ...
                    outputDir, ...
                    filename);


            %% =================================================
            % SAFETY CHECK
            % =================================================

            if exist(filePath, "file")

                fprintf( ...
                    "WARNING: file already exists:\n%s\n", ...
                    filePath);

                fprintf( ...
                    "Run %d will overwrite this existing file.\n", ...
                    runCounter);

            end


            %% =================================================
            % RUN SIMULATION
            % =================================================

            try


                simOut = ...
                    sim(simIn);


                %% =============================================
                % T_surface_inv
                % =============================================

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


                %% =============================================
                % spatial_DTS
                % =============================================

                Tdts_ts = ...
                    getLoggedSignal( ...
                        simOut, ...
                        "spatial_DTS");


                t_dts = ...
                    Tdts_ts.Time(:);


                DTS_data = ...
                    Tdts_ts.Data;


                %% =============================================
                % FORMAT DTS
                % =============================================

                if ndims(DTS_data) == 3


                    if size(DTS_data,3) ~= numel(t_dts)

                        error( ...
                            "DTS time dimension mismatch. Size=%s, time=%d.", ...
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


                %% =============================================
                % CHECK DIMENSIONS
                % =============================================

                if numel(t_surface) < 2

                    error( ...
                        "T_surface_inv has fewer than 2 samples.");

                end


                if numel(t_dts) < 2

                    error( ...
                        "spatial_DTS has fewer than 2 samples.");

                end


                if size(T_DTS_raw,1) ~= numel(t_dts)

                    error( ...
                        "DTS data/time mismatch.");

                end


                %% =============================================
                % INTERPOLATE SURFACE TEMPERATURE
                % =============================================

                T_surface_export = ...
                    interp1( ...
                        t_surface, ...
                        T_surface_raw, ...
                        time_export, ...
                        "linear", ...
                        "extrap");


                %% =============================================
                % INTERPOLATE DTS
                % =============================================

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


                %% =============================================
                % OUTPUT TABLE
                % =============================================

                runTable = table;


                runTable.time_s = ...
                    time_export;


                runTable.T_surface_K = ...
                    T_surface_export;


                runTable.T_surface_C = ...
                    T_surface_export - 273.15;


                %% ---------------------------------------------
                % DTS CHANNELS
                % ----------------------------------------------

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


                %% =============================================
                % WRITE CSV
                % =============================================

                writetable( ...
                    runTable, ...
                    filePath);


                %% =============================================
                % MANIFEST SUCCESS
                % =============================================

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
                    Pload_fixed;


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


                %% =============================================
                % SAVE MANIFEST AFTER EVERY RUN
                % =============================================

                writetable( ...
                    manifest, ...
                    manifestPath);


                fprintf( ...
                    "SUCCESS: %s\n", ...
                    filename);


                fprintf( ...
                    "Manifest saved after run %d.\n", ...
                    runCounter);


            catch ME


                %% =============================================
                % MANIFEST FAILURE
                % =============================================

                fprintf( ...
                    "FAILED: %s\n", ...
                    filename);


                fprintf( ...
                    "Error: %s\n", ...
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
                    Pload_fixed;


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


                %% =============================================
                % SAVE FAILURE TO MANIFEST IMMEDIATELY
                % =============================================

                writetable( ...
                    manifest, ...
                    manifestPath);

            end

        end

    end

end


%% ============================================================
% FINAL SAVE MANIFEST
% ============================================================

writetable( ...
    manifest, ...
    manifestPath);


%% ============================================================
% SUMMARY
% ============================================================

completedRows = ...
    manifest.run_id >= first_run & ...
    manifest.run_id <= last_run;


nSuccessRemaining = ...
    sum( ...
        completedRows & ...
        manifest.status == "success");


nFailedRemaining = ...
    sum( ...
        completedRows & ...
        manifest.status == "failed");


fprintf("\n");
fprintf("============================================\n");
fprintf("RUNS 49-100 COMPLETE\n");
fprintf("============================================\n");

fprintf( ...
    "Requested continuation runs: %d\n", ...
    last_run - first_run + 1);

fprintf( ...
    "Successful runs:             %d\n", ...
    nSuccessRemaining);

fprintf( ...
    "Failed runs:                 %d\n", ...
    nFailedRemaining);

fprintf( ...
    "Samples/run:                 %d\n", ...
    n_export);


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


        if isa(candidate, "timeseries")

            ts = candidate;

            return;


        elseif isa( ...
                candidate, ...
                "Simulink.SimulationData.Signal")


            ts = ...
                candidate.Values;


            return;

        end


    catch
        % Continue to logsout.
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
        % Continue to error.
    end


    %% --------------------------------------------------------
    % SIGNAL NOT FOUND
    % ---------------------------------------------------------

    error( ...
        "Signal '%s' was not found in SimulationOutput or logsout.", ...
        signalName);

end