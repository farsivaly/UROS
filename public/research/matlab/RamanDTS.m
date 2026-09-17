%% Raman DTS degradation features

severity = categorical({'Healthy','Mild','Moderate','Severe'});
severity = reordercats(severity, {'Healthy','Mild','Moderate','Severe'});

% Extracted DTS features
peakT = [299.274 299.403 299.531 299.783];      % K
deltaT = [1.770 1.899 2.026 2.279];             % K
aucDTS = [51.91 55.76 59.54 66.89];             % K*s
maxdTdt = [0.0337 0.0361 0.0386 0.0434];        % K/s

%% Normalise against Healthy case
deltaT_norm = deltaT ./ deltaT(1);
auc_norm = aucDTS ./ aucDTS(1);
dTdt_norm = maxdTdt ./ maxdTdt(1);

features_norm = [deltaT_norm;
                 auc_norm;
                 dTdt_norm]';

%% Plot
figure('Color','w');

plot(severity, deltaT_norm, '-o', ...
    'LineWidth', 2, 'MarkerSize', 8);
hold on;

plot(severity, auc_norm, '-s', ...
    'LineWidth', 2, 'MarkerSize', 8);

plot(severity, dTdt_norm, '-^', ...
    'LineWidth', 2, 'MarkerSize', 8);

yline(1,'--','Healthy baseline');

ylabel('Normalised feature, F/F_{Healthy}');
xlabel('Degradation severity');

title('Degradation-sensitive Raman DTS features');

legend('\DeltaT_{DTS}', ...
       'DTS AUC', ...
       'max |dT_{DTS}/dt|', ...
       'Location','northwest');

ylim([0.98 1.32]);
grid on;
box on;

set(gca,'FontSize',12,'LineWidth',1.2);

